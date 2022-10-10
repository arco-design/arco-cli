import axios from 'axios';

export default async function getArcoHost(isPrivate: boolean): Promise<string> {
  const {
    data: { result: hostInfo },
  } = await axios.get('https://arco.design/material/api/getHostInfo');
  return hostInfo[isPrivate ? 'private' : 'public'].arco;
}
