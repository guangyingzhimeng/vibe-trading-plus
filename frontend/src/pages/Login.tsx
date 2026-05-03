import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Loader2, QrCode, RefreshCw } from "lucide-react";
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

  const copyScene = async () => {
    if (!session?.scene) return;
    try {
      await navigator.clipboard.writeText(session.scene);
      toast.success("场景码已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  const refresh = () => {
    createSession();
  };

  const statusText = completing ? "授权成功，正在进入..." : status?.statusText || "请使用微信扫描二维码";

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-lg border bg-card shadow-sm md:grid-cols-[1fr_420px]">
          <section className="flex flex-col justify-between border-b bg-muted/30 p-8 md:border-b-0 md:border-r">
            <div>
              <div className="mb-10 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Vibe-Trading</h1>
                  <p className="text-sm text-muted-foreground">DreamAuth 扫码登录</p>
                </div>
              </div>
              <div className="max-w-md space-y-4">
                <p className="text-3xl font-semibold leading-tight tracking-tight">
                  用微信完成授权，进入量化研究工作台。
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  二维码由 Vibe-Trading 后端向 DreamAuth 开放平台创建，浏览器不会接触 AK/SK。
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="rounded-md border bg-background/70 p-3">后端代签</div>
              <div className="rounded-md border bg-background/70 p-3">实时轮询</div>
              <div className="rounded-md border bg-background/70 p-3">本地会话</div>
            </div>
          </section>

          <section className="flex flex-col items-center p-8">
            <div className="mb-5 flex w-full items-center justify-between">
              <div>
                <h2 className="font-semibold">微信扫码</h2>
                <p className="text-xs text-muted-foreground">{statusText}</p>
              </div>
              <button
                onClick={refresh}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                title="刷新二维码"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-lg border bg-white p-4">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : session?.qrcode ? (
                <img src={session.qrcode} alt="DreamAuth 登录二维码" className="h-full w-full object-contain" />
              ) : (
                <QrCode className="h-12 w-12 text-muted-foreground" />
              )}
            </div>

            <div className="mt-5 flex min-h-6 items-center gap-2 text-sm">
              {completing ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : status?.loginReady ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-warning" />
              )}
              <span className="text-muted-foreground">{statusText}</span>
            </div>

            {session?.scene && (
              <div className="mt-6 w-full rounded-md border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">场景码</span>
                  <button
                    onClick={copyScene}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    复制
                  </button>
                </div>
                <div className="break-all font-mono text-sm">{session.scene}</div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
