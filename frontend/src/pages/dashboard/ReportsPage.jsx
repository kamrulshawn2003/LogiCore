import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import Button from '../../components/common/Button';
import { FiDownload, FiBarChart2, FiPackage, FiShoppingCart, FiTruck, FiUsers } from 'react-icons/fi';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }

    setLoading(true);
    try {
      let data;
      switch (reportType) {
        case 'sales':
          data = await reportService.getSalesReport(startDate, endDate);
          break;
        case 'inventory':
          data = await reportService.getInventoryReport();
          break;
        case 'purchases':
          data = await reportService.getPurchaseReport(startDate, endDate);
          break;
        case 'shipments':
          data = await reportService.getShipmentReport(startDate, endDate);
          break;
        case 'supplier':
          data = await reportService.getSupplierPerformance();
          break;
        default:
          data = null;
      }
      setReportData(data);
    } catch (error) {
      toast.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'sales', name: 'Sales Report', icon: FiBarChart2 },
    { id: 'inventory', name: 'Inventory Report', icon: FiPackage },
    { id: 'purchases', name: 'Purchase Report', icon: FiShoppingCart },
    { id: 'shipments', name: 'Shipment Report', icon: FiTruck },
    { id: 'supplier', name: 'Supplier Performance', icon: FiUsers },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports</h2>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {reportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setReportType(type.id)}
            className={`p-4 rounded-lg border-2 transition-colors ${
              reportType === type.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <type.icon className={`h-6 w-6 mx-auto mb-2 ${
              reportType === type.id ? 'text-primary-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm font-medium text-center ${
              reportType === type.id ? 'text-primary-600' : 'text-gray-600'
            }`}>
              {type.name}
            </p>
          </button>
        ))}
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <Button onClick={fetchReport} loading={loading}>
            Generate Report
          </Button>
          {reportData && (
            <Button variant="secondary" onClick={() => window.print()}>
              <FiDownload className="mr-2 h-5 w-5" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {reportData.report?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(reportData.report.summary).map(([key, value]) => (
                <div key={key} className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' && key.includes('value') ? `$${value.toFixed(2)}` : value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          {reportData.report?.data && reportData.report.data.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <ResponsiveContainer width="100%" height={400}>
                {reportType === 'sales' ? (
                  <LineChart data={reportData.report.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                    <Line type="monotone" dataKey="order_count" stroke="#82ca9d" />
                  </LineChart>
                ) : reportType === 'inventory' ? (
                  <BarChart data={reportData.report.data.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product.name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="available" fill="#8884d8" />
                    <Bar dataKey="reserved" fill="#82ca9d" />
                  </BarChart>
                ) : (
                  <BarChart data={reportData.report.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Data Table */}
          {reportData.report?.data && reportData.report.data.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(reportData.report.data[0]).slice(0, 6).map((key) => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.report.data.slice(0, 20).map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).slice(0, 6).map((value, i) => (
                          <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;