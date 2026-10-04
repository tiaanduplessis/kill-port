/**
 * Kill processes listening on a local port. Invalid inputs or failed commands reject.
 * Ports must be integers from 1 to 65535; strings must contain decimal digits
 * (surrounding whitespace is allowed). Values are validated at runtime.
 */
declare function killPort(
  port: number | string,
  protocol?: killPort.Protocol,
  signal?: killPort.Signal
): Promise<killPort.Result>;

declare namespace killPort {
  /** TCP or UDP, case insensitive. Defaults to TCP. */
  type Protocol = 'tcp' | 'tcP' | 'tCp' | 'tCP' | 'Tcp' | 'TcP' | 'TCp' | 'TCP'
    | 'udp' | 'udP' | 'uDp' | 'uDP' | 'Udp' | 'UdP' | 'UDp' | 'UDP';
  /** Defaults to SIGKILL. Windows supports only SIGKILL. */
  type Signal = 'SIGHUP' | 'SIGINT' | 'SIGQUIT' | 'SIGABRT' | 'SIGKILL' | 'SIGTERM';
  /** Result of the final termination command. Command failures reject the promise. */
  interface Result {
    stdout: string;
    stderr: string;
    cmd: string;
    code: 0;
    error?: undefined;
  }
}

export = killPort;
