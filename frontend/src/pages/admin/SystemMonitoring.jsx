import React, { useState, useEffect } from 'react'
import { 
  Monitor, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'

const SystemMonitoring = () => {
  const [systemMetrics, setSystemMetrics] = useState({})
  const [alerts, setAlerts] = useState([])
  const [performance, setPerformance] = useState({})
  const [logs, setLogs] = useState([])
  
  useEffect(() => {
    // Mock data
    setSystemMetrics({
      cpu: 45,
      memory: 68,
      disk: 32,
      network: 12,
      uptime: '15 days, 3 hours',
      responseTime: 120,
      throughput: 1250
    })
    
    setAlerts([
      { id: 1, type: 'warning', message: 'High CPU usage detected', time: '5 minutes ago', severity: 'medium' },
      { id: 2, type: 'info', message: 'Database backup completed', time: '1 hour ago', severity: 'low' },
      { id: 3, type: 'error', message: 'API rate limit exceeded', time: '2 hours ago', severity: 'high' },
      { id: 4, type: 'success', message: 'System update completed', time: '3 hours ago', severity: 'low' }
    ])
    
    setPerformance({
      apiResponseTime: 120,
      databaseQueryTime: 45,
      cacheHitRate: 85,
      errorRate: 0.5,
      throughput: 1250,
      activeConnections: 45
    })
    
    setLogs([
      { id: 1, level: 'info', message: 'User login successful', time: '2024-01-22 15:30:45', source: 'auth' },
      { id: 2, level: 'warning', message: 'Rate limit exceeded for user', time: '2024-01-22 15:25:12', source: 'api' },
      { id: 3, level: 'error', message: 'Database connection failed', time: '2024-01-22 15:20:33', source: 'database' },
      { id: 4, level: 'info', message: 'Question generated successfully', time: '2024-01-22 15:15:22', source: 'ai' }
    ])
  }, [])
  
  const getAlertColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'success':
        return 'text-green-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }
  
  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'info':
        return <Activity className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }
  
  const getLogColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">System Monitoring</h1>
        <p className="text-orange-100">
          Monitor system health and performance metrics
        </p>
      </div>
      
      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.cpu}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Cpu className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${systemMetrics.cpu}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.memory}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${systemMetrics.memory}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disk Usage</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.disk}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${systemMetrics.disk}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Network</p>
              <p className="text-2xl font-bold text-gray-900">{systemMetrics.network}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full" 
                style={{ width: `${systemMetrics.network}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Performance Metrics</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">API Response Time</span>
                <span className="text-sm font-bold text-gray-900">{performance.apiResponseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Database Query Time</span>
                <span className="text-sm font-bold text-gray-900">{performance.databaseQueryTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Cache Hit Rate</span>
                <span className="text-sm font-bold text-gray-900">{performance.cacheHitRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Error Rate</span>
                <span className="text-sm font-bold text-gray-900">{performance.errorRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Throughput</span>
                <span className="text-sm font-bold text-gray-900">{performance.throughput} req/min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Active Connections</span>
                <span className="text-sm font-bold text-gray-900">{performance.activeConnections}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">System Alerts</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className={`text-sm ${getAlertColor(alert.type)}`}>{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* System Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">System Logs</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        log.level === 'error' ? 'bg-red-100 text-red-800' :
                        log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{log.message}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemMonitoring


