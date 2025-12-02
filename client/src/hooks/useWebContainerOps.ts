import { useCallback } from 'react';
import { useWebContainerInstance } from '../providers/WebContainerProvider';
import { useWebContainerStore } from '../store/webcontainerStore';

/**
 * Hook for WebContainer operations
 *
 * Provides methods to:
 * - Install npm dependencies
 * - Start dev server
 * - Stop server
 */
export const useWebContainerOps = () => {
  const { webcontainer } = useWebContainerInstance();
  const { setIsInstalling, setIsRunning, setPreviewUrl, addLog } = useWebContainerStore();

  /**
   * Install npm dependencies
   */
  const installDependencies = useCallback(async () => {
    if (!webcontainer) {
      addLog('❌ WebContainer not available');
      return;
    }

    setIsInstalling(true);
    addLog('📦 Installing dependencies...');

    try {
      const installProcess = await webcontainer.spawn('npm', ['install']);

      // Stream output to logs
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            addLog(data);
          },
        })
      );

      const exitCode = await installProcess.exit;

      if (exitCode !== 0) {
        throw new Error(`npm install failed with exit code ${exitCode}`);
      }

      addLog('✅ Dependencies installed successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`❌ Installation failed: ${errorMsg}`);
      throw error;
    } finally {
      setIsInstalling(false);
    }
  }, [webcontainer, setIsInstalling, addLog]);

  /**
   * Start development server
   * @param command - npm script to run (default: 'dev')
   */
  const startDevServer = useCallback(
    async (command: string = 'dev') => {
      if (!webcontainer) {
        addLog('❌ WebContainer not available');
        return;
      }

      setIsRunning(true);
      addLog(`🚀 Starting dev server with: npm run ${command}`);

      try {
        const devProcess = await webcontainer.spawn('npm', ['run', command]);

        // Stream output to logs
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              addLog(data);
            },
          })
        );

        // Listen for server-ready event
        webcontainer.on('server-ready', (_port, url) => {
          addLog(`✅ Server running at ${url}`);
          setPreviewUrl(url);
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        addLog(`❌ Failed to start server: ${errorMsg}`);
        setIsRunning(false);
        throw error;
      }
    },
    [webcontainer, setIsRunning, setPreviewUrl, addLog]
  );

  /**
   * Stop all running processes
   */
  const stopServer = useCallback(() => {
    if (!webcontainer) return;

    setIsRunning(false);
    setPreviewUrl(null);
    addLog('⏹️ Server stopped');
  }, [webcontainer, setIsRunning, setPreviewUrl, addLog]);

  return {
    installDependencies,
    startDevServer,
    stopServer,
  };
};
