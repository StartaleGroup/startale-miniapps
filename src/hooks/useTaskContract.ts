import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi } from 'viem';

// Replace with your contract address after deployment
const CONTRACT_ADDRESS = '0x0070174febef8551315fc8b9d3516494af5eccbc' as `0x${string}`;

const taskTrackerAbi = parseAbi([
  'function createTask(string calldata description) external',
  'function completeTask(uint256 taskId) external',
  'function getUserTasks(address user) external view returns ((string description, bool completed, uint256 timestamp)[])',
  'function getCompletedCount(address user) external view returns (uint256)',
  'event TaskCreated(address indexed user, uint256 taskId, string description)',
  'event TaskCompleted(address indexed user, uint256 taskId)',
]);

export type Task = {
  description: string;
  completed: boolean;
  timestamp: bigint;
};

export function useTaskContract(userAddress: `0x${string}` | undefined) {
  const { data: tasks, refetch: refetchTasks } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: taskTrackerAbi,
    functionName: 'getUserTasks',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress }
  });

  const { data: completedCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: taskTrackerAbi,
    functionName: 'getCompletedCount',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress }
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash
  });

  const createTask = (description: string) => {
    if (!description.trim()) {
      console.error('Task description cannot be empty');
      return;
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: taskTrackerAbi,
      functionName: 'createTask',
      args: [description],
    });
  };

  const completeTask = (taskId: number) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: taskTrackerAbi,
      functionName: 'completeTask',
      args: [BigInt(taskId)],
    });
  };

  return {
    tasks: (tasks as Task[]) || [],
    completedCount: completedCount ? Number(completedCount) : 0,
    createTask,
    completeTask,
    isPending,
    isConfirming,
    isSuccess,
    error,
    refetchTasks,
    transactionHash: hash,
  };
}