
data = [20000, 14000, 12000, 15000, 18000, 19000, 22000];




/**Chart Options - Radius options are here**/
var options = {
	//Border radius; Default: 0; If a negative value is passed, it will overwrite to 0;
  cornerRadius: 25, 
  //Default: false; if true, this would round all corners of final box;
  fullCornerRadius: true, 
  //Default: false; if true, this rounds each box in the stack instead of only final box;
  stackedRounded: true,
  responsive: false,
  maintainAspectRatio: false,
  tooltips: {
    enabled: false
  },
	elements: {
    point: {
      radius: 10
    }
  },
  dataset : {
    barThickness: 15
  },
  legend: {
    display: true
	},
  scales: {
    yAxes: [{
      stacked: true,
      radius: 10,
      display: true
    }],
    xAxes: [{
      stacked: true,
		  display: false
    }]
  },
  plugins: {
    datalabels: {
        color: 'blue',
        labels: {
            title: {
                font: {
                    weight: 'bold'
                }
            },
            value: {
                color: 'green'
            }
        },
        anchor : 'center',
        align : 'center',
        offset : 0

    }
  }  
};


barChartData = {
    labels: ['1', '2', '3', '4', '5', '6', '7'],
    datasets: [{
        label: 'Dataset 1',
        backgroundColor: [
            'rgba(200, 200, 200, 1)','rgba(200, 200, 200, 1)','rgba(200, 200, 200, 1)'
          ],
        data : [20000, 14000, 12000, 15000, 18000, 19000, 22000]
    }, 
    {
        label: 'Dataset 2',
        backgroundColor: [
            'rgba(240, 100, 100, 1)','rgba(240, 100, 100, 1)','rgba(240, 100, 100, 1)'
          ],
        data : [24000, 10000, 12000, 15000, 18000, 19000, 22000]
    }]
}

var ctxBar = document.getElementById("myChart");
var myBarChart1 = new Chart(ctxBar, {
    type: 'horizontalBar',
    data: barChartData,
    options: options
});