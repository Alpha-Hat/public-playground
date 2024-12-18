import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import '@aws-amplify/ui-react/styles.css';
import { Line } from 'react-chartjs-2';
import { v4 as uuidv4 } from 'uuid';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Manually Register necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Visual component box to Question
function AddSituation({ note, setNote, setApiMessage, setChartData }) {
  function handleNoteChange(e) {
    setNote(e.target.value);
  }

  async function handleSubmit() {
    if (note.trim() === '') {
      alert('Please enter a valid situation.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_ENDPOINT}src`, {
        mode: 'cors',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ situation: note }),
      });

      const responseData = await response.json();

    if (response.ok) {
      console.log('Situation added successfully');
      setApiMessage(responseData.message); // Update the apiMessage state with the recommendation message

      // Validate and set chartData
      console.log("chartData before setting:", responseData.chartData);
    if (
        responseData.chartData &&
        Array.isArray(responseData.chartData.labels) &&
        Array.isArray(responseData.chartData.values) &&
        responseData.chartData.labels.length > 0 &&
        responseData.chartData.values.length > 0
      ) {
        console.log("Setting chartData to:", responseData.chartData);
        setChartData({
          labels: responseData.chartData.labels,
          values: responseData.chartData.values,
        });
      } else {
        console.error('Invalid chart data format');
        setChartData(null); // Set to null if data is invalid
      }
      } else {
        console.error('Failed to add situation');
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setNote(''); // Reset input field
  }

  return (
    <div className="container p-3">
      <div className="input-group mb-3 p-3">
        <input
          type="text"
          className="form-control form-control-lg"
          placeholder="Add Your Financial Situation"
          aria-label="Question"
          aria-describedby="basic-addon2"
          value={note}
          onChange={handleNoteChange}
        />
        <button onClick={handleSubmit} className="btn btn-outline-success btn-lg" type="button">
          Submit
        </button>
      </div>
    </div>
  );
}

// Visual component box to output
function SituationOutput({ apiMessage }) {
  return (
     <div className="container">
      <div className="border border-primary rounded p-3 m-3" style={{ whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
        {apiMessage}
      </div>
    </div>
  );
}

// Component to display a dynamic investment outcome chart
function InvestmentChart({ chartData }) {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
  };

  const data = {
    labels: chartData && chartData.labels ? chartData.labels : [],
    datasets: [
      {
        label: 'Investment Outcome',
        data: chartData && chartData.values ? chartData.values : [],
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
      },
    ],
  };

  return (
    <div className="container">
      {chartData && chartData.labels && chartData.values && chartData.labels.length > 0 && chartData.values.length > 0 ? (
        <Line data={data} options={options} />
      ) : (
        <p>No data to display yet. Submit a financial situation.</p>
      )}
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="container">
      <p>
        <strong>Disclaimer:</strong> The investment outcomes presented are hypothetical and based on assumptions. Actual results may vary. Please consult a financial advisor.
      </p>
    </div>
  );
}



export default function App() {
  const [note, setNote] = useState('');
  const [apiMessage, setApiMessage] = useState(''); // State for the API message
  const [chartData, setChartData] = useState(null); // State for the chart data

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Take Control of Your Financial Safety</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React LIKE ME!
        </a>
      </header>
      {/* Pass setApiMessage so it can be updated when note is submitted */}
      <AddSituation note={note} setNote={setNote} setApiMessage={setApiMessage} setChartData={setChartData} />
      <SituationOutput apiMessage={apiMessage} /> {/* Pass apiMessage to display */}
      <InvestmentChart chartData={chartData} />
        <Disclaimer /> 
    </div>
  );
}

