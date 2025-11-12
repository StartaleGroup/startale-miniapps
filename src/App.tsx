import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useTaskContract } from './hooks/useTaskContract';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Hook del contrato inteligente
  const {
    tasks,
    completedCount,
    createTask,
    completeTask,
    isPending,
    isConfirming,
    isSuccess,
    refetchTasks,
  } = useTaskContract(address);

  useEffect(() => {
    async function initApp() {
      try {
        // Get Farcaster context (user info, launch location)
        const context = sdk.context;
        setUserContext(context);

        // Signal to host that App is ready (removes splash screen)
        await sdk.actions.ready();
      } catch (error) {
        console.log('Running in development mode (not in Farcaster Frame)');
      }
      setIsReady(true);
    }

    initApp();
  }, []);

  // Refrescar tareas cuando la transacción sea exitosa
  useEffect(() => {
    if (isSuccess) {
      refetchTasks();
      setNewTaskDescription('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [isSuccess, refetchTasks]);

  const handleConnect = () => {
    // En desarrollo, usa el conector injected (MetaMask, etc.)
    const injectedConnector = connectors.find(c => c.id === 'injected');

    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else {
      console.error('No wallet connector found. Please install MetaMask or another Web3 wallet.');
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskDescription.trim()) {
      createTask(newTaskDescription);
    }
  };

  const handleCompleteTask = (taskId: number) => {
    completeTask(taskId);
  };

  if (!isReady) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading Task Tracker...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <div className="header">
          <div className="logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="url(#gradient)"/>
              <path d="M24 12L32 20L24 28L16 20L24 12Z" fill="white" fillOpacity="0.9"/>
              <path d="M24 20L32 28L24 36L16 28L24 20Z" fill="white" fillOpacity="0.6"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8B5CF6"/>
                  <stop offset="1" stopColor="#6366F1"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Task Tracker</h1>
          <p className="subtitle">Manage your tasks on Soneium Minato</p>
        </div>

        {userContext?.user && (
          <div className="user-info-card">
            <div className="user-header">
              <div className="avatar">
                {userContext.user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <p className="username">@{userContext.user.username}</p>
                <p className="fid">FID: {userContext.user.fid}</p>
              </div>
            </div>
            <div className="launch-context">
              <span className="context-badge">
                {userContext.location?.type || 'direct'}
              </span>
            </div>
          </div>
        )}

        <div className="wallet-section">
          {!isConnected ? (
            <button onClick={handleConnect} className="connect-button">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 5H2.5C1.67157 5 1 5.67157 1 6.5V13.5C1 14.3284 1.67157 15 2.5 15H17.5C18.3284 15 19 14.3284 19 13.5V6.5C19 5.67157 18.3284 5 17.5 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 10C14 10.5523 13.5523 11 13 11C12.4477 11 12 10.5523 12 10C12 9.44772 12.4477 9 13 9C13.5523 9 14 9.44772 14 10Z" fill="currentColor"/>
              </svg>
              Connect Wallet
            </button>
          ) : (
            <div className="connected-wallet">
              <div className="wallet-info">
                <div className="status-indicator"></div>
                <div>
                  <p className="wallet-label">Connected Wallet</p>
                  <p className="wallet-address">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </div>
              <button onClick={() => disconnect()} className="disconnect-button">
                Disconnect
              </button>
            </div>
          )}
        </div>

        {isConnected && (
          <>
            {/* Stats Card */}
            <div className="stats-card">
              <div className="stat-item">
                <p className="stat-label">Total Tasks</p>
                <p className="stat-value">{tasks.length}</p>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <p className="stat-label">Completed</p>
                <p className="stat-value stat-value-success">{completedCount}</p>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <p className="stat-label">Pending</p>
                <p className="stat-value stat-value-warning">{tasks.length - completedCount}</p>
              </div>
            </div>

            {/* Create Task Form */}
            <form onSubmit={handleCreateTask} className="create-task-form">
              <input
                type="text"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="What do you need to do?"
                className="task-input"
                disabled={isPending || isConfirming}
              />
              <button
                type="submit"
                className="create-task-button"
                disabled={isPending || isConfirming || !newTaskDescription.trim()}
              >
                {isPending || isConfirming ? (
                  <>
                    <div className="button-loader"></div>
                    {isPending ? 'Confirming...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add Task
                  </>
                )}
              </button>
            </form>

            {/* Success Message */}
            {showSuccess && (
              <div className="success-message">
                ✓ Transaction confirmed! Task updated.
              </div>
            )}

            {/* Tasks List */}
            <div className="tasks-section">
              <h2 className="section-title">Your Tasks</h2>

              {tasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p className="empty-text">No tasks yet</p>
                  <p className="empty-subtext">Create your first task to get started!</p>
                </div>
              ) : (
                <div className="tasks-list">
                  {tasks.map((task, index) => (
                    <div
                      key={index}
                      className={`task-item ${task.completed ? 'task-completed' : ''}`}
                    >
                      <div className="task-content">
                        <div className="task-checkbox">
                          {task.completed ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" fill="#10b981"/>
                              <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <div className="checkbox-empty"></div>
                          )}
                        </div>
                        <div className="task-details">
                          <p className="task-description">{task.description}</p>
                          <p className="task-timestamp">
                            {new Date(Number(task.timestamp) * 1000).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      {!task.completed && (
                        <button
                          onClick={() => handleCompleteTask(index)}
                          className="complete-button"
                          disabled={isPending || isConfirming}
                        >
                          {isPending || isConfirming ? '...' : 'Complete'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!isConnected && (
          <div className="info-card">
            <p className="info-text">
              Connect your wallet to start tracking tasks on Soneium Minato testnet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;