
import React from 'react';
import ReactDOM from 'react-dom';
import {Game} from './App.jsx';
import DevTools from 'mobx-react-devtools';

ReactDOM.render(<div><Game/><DevTools/></div>, document.getElementById('app'));

