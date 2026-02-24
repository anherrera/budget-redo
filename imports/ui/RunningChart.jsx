import React from 'react';
import Chart from 'react-apexcharts';

export const RunningChart = ({ options, series }) => {

    const seriesData = [{
        name: 'Balance',
        data: series
    }];

    return (
        <Chart
            options={options}
            series={seriesData}
            type="area"
            width="100%"
            height={220}
        />
    );
};
