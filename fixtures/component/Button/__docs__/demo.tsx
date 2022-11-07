import React from 'react';
import ReactDOM from 'react-dom';
import Button from '..';

function App() {
  return (
    <div>
      <Button content="Hello button" />
    </div>
  );
}

ReactDOM.render(<App />, document.querySelector('#root'));
