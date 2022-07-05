import React, {useState} from 'react';
import Chart from 'react-apexcharts';

export const RunningChart = ({ options, series }) => {

    const seriesData = [{
        name: 'one',
        data: series
    }];

    return (
        <Chart
            options={options}
            series={seriesData}
            type="line"
            width="400px"
        />
    );
};