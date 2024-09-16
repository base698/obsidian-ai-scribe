import { exec } from 'child_process';
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
  private processId: number | null = null;

  async start(command: string): Promise<void> {
    try {
      // Start the process with nohup and redirect output
      //const { stdout,stderr } = await execAsync(`nohup ${command} > /dev/null 2>&1 & echo $!`);
      const { stdout } = await execAsync(`echo $PWD;nohup ${command} > /dev/null 2>&1 `);
      this.processId = parseInt(stdout.trim(), 10);
      console.log(`Process started with PID: ${this.processId}`);
    } catch (error) {
      console.error('Failed to start process:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.processId) {
      try {
        await execAsync(`kill ${this.processId}`);
        console.log(`Process with PID ${this.processId} stopped`);
        this.processId = null;
      } catch (error) {
        console.error('Failed to stop process:', error);
        throw error;
      }
    } else {
      console.log('No process is currently running');
    }
  }

  isRunning(): boolean {
    return this.processId !== null;
  }
}
