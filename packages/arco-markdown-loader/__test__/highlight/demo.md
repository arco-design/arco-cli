# Markdown Highlight

Markdown highlight code.

```js
import { Avatar, Typography, Space } from '@arco-design/web-react';
import { IconUser } from '@arco-design/web-react/icon';

const { Text } = Typography;

const App = () => {
  <Space size="large">
    <Avatar>A</Avatar>
    <Avatar style={{ backgroundColor: '#3370ff' }}>
      <IconUser />
    </Avatar>
    <Avatar style={{ backgroundColor: '#14a9f8' }}>Arco</Avatar>
    <Avatar style={{ backgroundColor: '#00d0b6' }}>Design</Avatar>
    <Avatar>
      <img alt="avatar" src="xx.png" />
    </Avatar>
  </Space>;
};

export default App;
```
