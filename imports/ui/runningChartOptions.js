import {deepPurple} from '@mui/material/colors';

// ApexCharts options for the Balance Trend area chart.
export const runningChartOptions = ({darkMode, chartCategories, min}) => ({
    chart: {
        id: 'runningChart',
        background: 'transparent',
        toolbar: { show: false },
        dropShadow: {
            enabled: true,
            top: 3,
            left: 0,
            blur: 6,
            color: darkMode ? deepPurple[300] : deepPurple[500],
            opacity: 0.25,
        },
    },
    theme: {
        mode: darkMode ? 'dark' : 'light',
    },
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [0, 90, 100],
            colorStops: [{
                offset: 0,
                color: darkMode ? deepPurple[300] : deepPurple[500],
                opacity: 0.4,
            }, {
                offset: 100,
                color: darkMode ? deepPurple[300] : deepPurple[500],
                opacity: 0.02,
            }],
        },
    },
    dataLabels: { enabled: false },
    xaxis: {
        categories: chartCategories,
        type: 'datetime',
        labels: {
            rotate: -45,
            style: {
                fontSize: '10px',
                fontFamily: '"Inter", sans-serif',
                colors: darkMode ? '#bdbdbd' : '#616161',
            },
        },
        axisBorder: { show: false },
    },
    yaxis: {
        min: min < 0 ? min : 0,
        labels: {
            formatter: (val) => `$${val?.toLocaleString() ?? '0'}`,
            style: {
                fontSize: '11px',
                fontFamily: '"JetBrains Mono", monospace',
                colors: darkMode ? '#bdbdbd' : '#616161',
            },
        },
    },
    grid: {
        borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        strokeDashArray: 4,
    },
    stroke: {
        curve: 'smooth',
        width: 2.5,
        colors: [darkMode ? deepPurple[300] : deepPurple[500]],
    },
    markers: {
        size: 0,
        hover: { size: 5 },
    },
    tooltip: {
        y: {
            formatter: (val) => `$${val?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`,
        },
    },
    annotations: min < 0 ? {
        yaxis: [{
            y: 0,
            borderColor: darkMode ? '#ef5350' : '#d32f2f',
            strokeDashArray: 3,
            label: {
                text: 'Zero',
                style: {
                    color: '#fff',
                    background: darkMode ? '#ef5350' : '#d32f2f',
                    fontSize: '10px',
                },
            },
        }],
    } : {},
});
