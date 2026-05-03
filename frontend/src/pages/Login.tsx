import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, QrCode, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { api, setAuthToken, type DreamAuthSession, type DreamAuthStatus } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const QR_REFRESH_INTERVAL_MS = 60000;

export function Login() {
  const navigate = useNavigate();
  const [session, setSession] = useState<DreamAuthSession | null>(null);
  const [status, setStatus] = useState<DreamAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const completingRef = useRef(false);

  const createSession = async () => {
    completingRef.current = false;
    setCompleting(false);
    setLoading(true);
    setStatus(null);
    try {
      const next = await api.createDreamAuthSession("user");
      setSession(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取二维码失败");
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createSession();
  }, []);

  useEffect(() => {
    if (!session?.sessionNo || completing) return;
    const timer = window.setTimeout(() => {
      createSession();
    }, QR_REFRESH_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [completing, session?.sessionNo]);

  useEffect(() => {
    if (!session?.sessionNo) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const nextStatus = await api.getDreamAuthStatus(session.sessionNo);
        if (cancelled) return;
        setStatus(nextStatus);
        if (nextStatus.loginReady && !completingRef.current) {
          completingRef.current = true;
          setCompleting(true);
          const result = await api.completeDreamAuthLogin(session.sessionNo);
          setAuthToken(result.token);
          toast.success("登录成功");
          navigate("/agent", { replace: true });
          return;
        }
        if (nextStatus.expired || nextStatus.status === 4 || nextStatus.status === 6) {
          return;
        }
      } catch (error) {
        if (!cancelled) {
          completingRef.current = false;
          setCompleting(false);
          setStatus((prev) => prev ?? {
            sessionNo: session.sessionNo,
            status: 0,
            statusText: error instanceof Error ? error.message : "状态获取失败",
            loginReady: false,
            expired: false,
          });
        }
      } finally {
        if (!cancelled && !completingRef.current) {
          timer = window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    timer = window.setTimeout(poll, 400);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [navigate, session?.sessionNo]);

  const statusText = completing ? "授权成功，正在进入..." : "请使用微信扫一扫";
  const showSuccess = completing || status?.loginReady;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080b10] text-slate-100">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.18)_0%,transparent_30%,transparent_68%,rgba(59,130,246,0.14)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
        <div className="grid w-full overflow-hidden rounded-lg border border-white/10 bg-[#0d1118]/88 shadow-2xl shadow-black/45 backdrop-blur md:grid-cols-[1fr_380px]">
          <section className="relative min-h-[360px] overflow-hidden border-b border-white/10 p-8 md:border-b-0 md:border-r">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent md:inset-y-0 md:left-auto md:h-auto md:w-px md:bg-gradient-to-b" />
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">Vibe-Trading</h1>
                  <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">Quant Research</p>
                </div>
              </div>

              <div className="max-w-xl py-16 md:py-0">
                <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Secure Workspace</p>
                <h2 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                  进入你的量化研究驾驶舱。
                </h2>
                <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
                  扫码后即可继续使用智能体、回测、组合分析与研究会话。
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
                <div className="border-t border-white/10 pt-3">Research</div>
                <div className="border-t border-white/10 pt-3">Backtest</div>
                <div className="border-t border-white/10 pt-3">Swarm</div>
              </div>
            </div>
          </section>

          <section className="flex flex-col items-center justify-center bg-slate-950/30 p-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold tracking-tight">微信扫码登录</h2>
              <p className="mt-2 text-sm text-slate-400">请使用微信扫一扫</p>
            </div>

            <div className="relative">
              <div className="absolute -inset-3 rounded-lg border border-amber-300/10 bg-amber-300/5 blur-sm" />
              <div className="relative flex aspect-square w-[260px] items-center justify-center rounded-lg border border-white/12 bg-white p-4 shadow-xl shadow-black/35">
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                ) : session?.qrcode ? (
                  <img src={session.qrcode} alt="DreamAuth 登录二维码" className="h-full w-full object-contain" />
                ) : (
                  <QrCode className="h-12 w-12 text-slate-500" />
                )}
              </div>
            </div>

            <div className="mt-6 flex min-h-6 items-center gap-2 text-sm text-slate-300">
              {completing ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
              ) : showSuccess ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.75)]" />
              )}
              <span>{statusText}</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
