import { exec } from 'child_process';
import { DataAdapter } from 'obsidian';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function start(command: string): Promise<void> {
    try {
      // Start the process with nohup and redirect output
      //const { stdout,stderr } = await execAsync(`nohup ${command} > /dev/null 2>&1 & echo $!`);
      const { stdout,stderr } = await execAsync(command);
      console.log(stdout);
      console.error(stderr);
    } catch (error) {
      console.error('Failed to start process:', error);
      throw error;
    }
  }


export default class ProcessManager {
  private pid: number|null;
  private adapter: DataAdapter;

  constructor(adapter: DataAdapter) {
    this.adapter = adapter;
    this.pid = null;
  }

  async getPid(pidFile:string): Promise<number> {
    const pidStr = await this.adapter.read(pidFile)
    this.pid = parseInt(pidStr,10);
    return this.pid;
  }

  async start(command: string): Promise<void> {
    try {
      const { stdout } = await execAsync(command);
      const pidStr = stdout.trim();
      this.pid = parseInt(pidStr,10);
    } catch (error) {
      console.error('Failed to start process:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.pid) {
      try {
        await execAsync(`kill ${this.pid}`);
        this.pid = null;
      } catch (error) {
        console.error('Failed to stop process:', error);
        throw error;
      }
    } else {
      console.log('No process is currently running');
    }
  }

  isRunning(): boolean {
    return this.pid !== null;
  }
}
