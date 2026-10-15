import { Component } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

class StartupBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return <main className="startup-error"><b>THE ACADEMY COULD NOT START</b><p>{this.state.error.message}</p><button onClick={() => location.reload()}>Retry launch</button></main>
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<StartupBoundary><App /></StartupBoundary>)
