let resultPromise: Promise<killPort.Result>;
resultPromise = killPort(3000);
resultPromise = killPort('3000');
const stringPort: string = '3000';
resultPromise = killPort(stringPort);
resultPromise = killPort(' 03000 ', 'tcp');
resultPromise = killPort(65535, 'udp');
resultPromise = killPort(3000, undefined, 'SIGTERM');
resultPromise = killPort(3000, undefined, undefined);
const protocols: killPort.Protocol[] = ['tcp', 'tcP', 'tCp', 'tCP', 'Tcp', 'TcP', 'TCp', 'TCP', 'udp', 'udP', 'uDp', 'uDP', 'Udp', 'UdP', 'UDp', 'UDP'];
const signals: killPort.Signal[] = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGKILL', 'SIGTERM'];
protocols.forEach(protocol => signals.forEach(signal => killPort('3000', protocol, signal)));
resultPromise.then(result => {
  const stdout: string = result.stdout;
  const stderr: string = result.stderr;
  const cmd: string = result.cmd;
  const code: 0 = result.code;
  const error: undefined = result.error;
  const compatible: {stdout: string; stderr: string; cmd: string; code: number | null; error?: Error} = result;
  // @ts-expect-error The result is structured, not a string.
  const text: string = result;
  // @ts-expect-error Success never has a nonzero exit code.
  const failed: 1 = result.code;
  // @ts-expect-error The result has no unknown members.
  result.missing;
});
// @ts-expect-error A port is required.
killPort();
// @ts-expect-error Boolean ports are not accepted.
killPort(true);
// @ts-expect-error Arrays are not accepted by the programmatic API.
killPort([3000, 3001]);
// @ts-expect-error A null port is invalid.
killPort(null);
// @ts-expect-error Only TCP or UDP protocols are accepted.
killPort(3000, 'sctp');
// @ts-expect-error Protocol names cannot contain shell syntax.
killPort(3000, 'tcp; echo injected');
// @ts-expect-error Protocol cannot be null.
killPort(3000, null);
// @ts-expect-error Signal names must be uppercase.
killPort(3000, 'tcp', 'sigterm');
// @ts-expect-error Only the six supported signal names are accepted.
killPort(3000, 'tcp', 'SIGSTOP');
// @ts-expect-error Numeric signals are not accepted.
killPort(3000, 'tcp', 15);
// @ts-expect-error Signal cannot be null.
killPort(3000, 'tcp', null);
// @ts-expect-error There is no fourth argument.
killPort(3000, 'tcp', 'SIGTERM', true);
