import { AddressInfo } from 'net';
import { Port } from '@arco-cli/legacy/dist/utils/network/port';
import { ExecutionContext } from '@aspect/envs';
import { DevServer } from './devServer';
import { BindError } from './exceptions';

export class ComponentServer {
  errors?: Error[];

  private _port: number;

  constructor(
    /**
     * components contained in the existing component server.
     */
    readonly context: ExecutionContext,

    /**
     * port range of the component server.
     */
    readonly portRange: number[],

    /**
     * env dev server.
     */
    readonly devServer: DevServer
  ) {}

  hostname: string | undefined;

  private async selectPort(portRange?: number[] | number) {
    return Port.getPortFromRange(portRange || [3100, 3200]);
  }

  private getHostname(address: string | AddressInfo | null) {
    if (address === null) throw new BindError();
    if (typeof address === 'string') return address;

    let hostname = address.address;
    if (hostname === '::') {
      hostname = 'localhost';
    }

    return hostname;
  }

  get port() {
    return this._port;
  }

  /**
   * get the url of the component server.
   */
  get url() {
    // tailing `/` is required!
    return `/preview/${this.context.envRuntime.id}/`;
  }

  async listen() {
    const port = await this.selectPort(this.portRange);
    this._port = port;
    const server = await this.devServer.listen(port);
    const address = server.address();
    const hostname = this.getHostname(address);
    if (!address) throw new BindError();
    this.hostname = hostname;
  }
}
