let spotifyData;
let mySpotifyChart;
let config;
let toggleState = 0;
let ctx2;
let backgroundColor = "#81b29a";

const CHART_COLOR = "#c1c1c1";

function getPapaParseSpotify() {
  Papa.parse(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSw3m_yyTByllweTNnIM13oR_P4RSXG2NpF3jfYKpmPtsS8a_s8qA7YIOdzaRgl6h5b2TSaY5ohuh6J/pub?output=csv",
    {
      download: true,
      header: true,
      complete: function (results) {
        // gamesMain(results.data);
        parseSpotify(results.data);
      },
      error: function (error) {
        console.log("failed to fetch from cache, spotify");
      },
    }
  );
}

getPapaParseSpotify();

// changes the description to the relevant text and changes the fill of the circles
function switchSpotifyDots() {
  let circles = Array.from(document.getElementsByClassName("spotifyCircles"));
  let desc = document.getElementById("spotify-desc");

  switch (toggleState) {
    case 0:
      desc.innerHTML = "On average, which days do I listen to the most music";
      break;
    case 1:
      desc.innerHTML =
        "How many songs have I listened to in the last two weeks";
      break;
    case 2:
      desc.innerHTML = "Each month, for the last two years";
      break;
  }
  circles.forEach((c) =>
    c.id.slice(-1) == toggleState
      ? (c.style.fill = "#f7f7f7")
      : (c.style.fill = "none")
  );
}

// updates the chart, calls the function to update the text and switch the dots and LASTLY increments the toggleState
function spotifyToggle() {
  switchSpotifyDots();
  switch (toggleState) {
    case 0:
      updateByDay();
      break;

    case 1:
      updateTwoWeeks();
      break;

    case 2:
      updateAllData();
      break;
  }
  toggleState == 2 ? (toggleState = 0) : toggleState++;
}

function parseSpotify(dataIn) {
  spotifyData = updateSpotify(dataIn);

  spotifyChart();
  spotifyToggle();
}

function createDatabase(dataIn) {
  let dataOut = {};
  dataOut.lastTwoWeeks = getLastTwoWeeks(dataIn);
  return dataOut;
}

// update the chart to show the data, aggregated by day, BAR CHART
function updateByDay() {
  const { data, labels } = spotifyData.byDay;

  let newDataset = {
    data: data,
    backgroundColor,
    // borderColor: CHART_COLOR,
  };

  if (mySpotifyChart.config.type == "line") {
    mySpotifyChart.destroy();
    let temp = { ...config };

    temp.type = "bar";

    temp.data.labels = labels;

    temp.data.datasets = [newDataset];

    temp.options.scales.xAxes[0] = {
      offset: true,
      gridLines: {
        color: CHART_COLOR,
      },
    };

    mySpotifyChart = new Chart(ctx2, temp);
  } else {
    console.log("THIS IS NEVER RUN");
    mySpotifyChart.data.labels = labels;
    mySpotifyChart.data.datasets = [newDataset];
    mySpotifyChart.options.scales = {
      xAxes: [
        {
          gridLines: {
            color: CHART_COLOR,
          },
        },
      ],
    };
    mySpotifyChart.update();
  }
}

// update the chart to show the data, for the last two weeks, LIN CHART
function updateTwoWeeks() {
  let { data, labels } = spotifyData.lastTwoWeeks;

  labels = labels.map((l) => new Date(l));

  let newDataset = {
    data: data,
    backgroundColor,
    // borderColor: CHART_COLOR,
  };

  if (mySpotifyChart.config.type == "bar") {
    mySpotifyChart.destroy();
    let temp = { ...config };

    temp.type = "line";

    temp.data.labels = labels;

    temp.data.datasets = [newDataset];

    temp.options.scales = {
      xAxes: [
        {
          type: "time",
          time: {
            unit: "day",
            round: "day",
            displayFormats: {
              day: "dd",
            },
          },
          gridLines: {
            color: CHART_COLOR,
          },
        },
      ],
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
          gridLines: {
            color: CHART_COLOR,
          },
        },
      ],
    };

    mySpotifyChart = new Chart(ctx2, temp);
  } else {
    mySpotifyChart.data.labels = labels;

    mySpotifyChart.data.datasets = [newDataset];

    mySpotifyChart.options.scales = {
      xAxes: [
        {
          type: "time",
          time: {
            unit: "day",
            round: "day",
            displayFormats: {
              day: "dd",
            },
          },
          gridLines: {
            color: CHART_COLOR,
          },
        },
      ],
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
          gridLines: {
            color: CHART_COLOR,
          },
        },
      ],
    };

    //   console.log(mySpotifyChart.data.datasets);

    mySpotifyChart.update();
  }
}

// update the chart to show the data, aggregated by week, LINE CHART
function updateAllData() {
  let { data, labels } = spotifyData.byWeek;
  let newDataset = {
    data: data,
    backgroundColor,
    // borderColor: CHART_COLOR,
  };

  if (mySpotifyChart.config.type == "bar") {
    mySpotifyChart.destroy();
    let temp = { ...config };
    temp.type = "line";

    temp.data.labels = labels;

    temp.data.datasets = [newDataset];

    temp.options.scales = {
      xAxes: [
        {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 4,
            maxRotation: 0,
            minRotation: 0,
          },
          gridLines: {
            color: CHART_COLOR,
          },
        },
      ],
      yAxes: [
        {
          gridLines: {
            color: CHART_COLOR,
          },
        },
      ],
    };
  } else {
    mySpotifyChart.data.labels = labels;

    mySpotifyChart.data.datasets = [newDataset];

    mySpotifyChart.options.scales = {
      xAxes: [
        {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 4,
            maxRotation: 0,
            minRotation: 0,
          },
          gridLines: {
            color: CHART_COLOR,
          },
        },
      ],
      yAxes: [
        {
          gridLines: {
            color: CHART_COLOR,
          },
        },
      ],
    };

    mySpotifyChart.update();
  }
}

// plot the template chart
function spotifyChart() {
  ctx2 = document.getElementById("spotifyChart").getContext("2d");
  config = {
    type: "line",
    data: {
      datasets: [
        {
          backgroundColor,
          // borderColor: CHART_COLOR,
        },
      ],
    },

    options: {
      maintainAspectRatio: true,
      responsive: true,

      legend: {
        display: false,
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
            gridLines: {
              color: CHART_COLOR,
            },
          },
        ],
        xAxes: [
          {
            gridLines: {
              color: CHART_COLOR,
            },
          },
        ],
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            let label = data.datasets[tooltipItem.datasetIndex].label || "";

            if (label) {
              label += ": ";
            }

            if (toggleState == 1) {
              label += tooltipItem.yLabel + " average";
            } else {
              label += tooltipItem.yLabel + " songs";
            }

            return label;
          },

          title: function (tooltipItem, data) {
            let title = tooltipItem[0].xLabel;
            if (toggleState == 1) {
              title = moment(title, "dd").format("dddd");
            }
            return title;
          },
        },
      },
    },
  };
  mySpotifyChart = new Chart(ctx2, config);
  Chart.defaults.global.defaultFontColor = CHART_COLOR;
}

function getLastTwoWeeks(dat) {
  let rawLabels = dat.map((e) => {
    return e.Date;
  });

  let rawData = dat.map((e) => {
    return e.Value;
  });

  let data = rawData.slice(0, 14);
  let labels = rawLabels.slice(0, 14);

  return { data, labels };
}

function getAllWeeks(dat) {
  let twoYearsAgo = moment().subtract(2, "years");
  dat = dat.filter((d) => {
    return moment(d.Date).isSameOrAfter(twoYearsAgo);
  });
  let weekAvg = _.chain(dat)
    .groupBy((d) => {
      return moment(d.Date).format("MMM-YYYY");
    })
    .map((entries, week) => ({
      wofy: week,
      avg: _.sumBy(entries, (entry) => +entry.Value),
    }))
    .value();

  weekAvg.sort(
    (a, b) => moment(a.wofy, "MMM-YYYY") - moment(b.wofy, "MMM-YYYY")
  );

  let labels = weekAvg.map((w) => w.wofy);
  let data = weekAvg.map((w) => w.avg);

  return { data, labels };
}

function getByDay(dat) {
  let totalAvgs = _.chain(dat)
    .map((d) => {
      let day = moment(d.Date).format("dd");
      return { ...d, dofw: day };
    })
    .groupBy("dofw")
    .map((entries, day) => ({
      dofw: day,
      avg: Math.round(_.meanBy(entries, (entry) => entry.Value)),
    }))
    .value();

  totalAvgs = _.sortBy(totalAvgs, (o) => {
    return moment(o.dofw, "dd").isoWeekday();
  });

  let labels = totalAvgs.map((val) => val.dofw);
  let data = totalAvgs.map((val) => val.avg);

  return { data, labels };
}

function parseSpotifyDates(results) {
  let dateParse = results.map((elem) => {
    return {
      Date: new Date(elem.Date),
      Value: +elem.Value,
    };
  });

  spotifyData = dateParse.sort(function (a, b) {
    return b.Date.getTime() - a.Date.getTime();
  });

  return spotifyData;
}

function updateSpotify(dataIn) {
  let parsed = parseSpotifyDates(dataIn);

  let dateOfLastTest = moment(parsed[0].Date).format("Do [of] MMMM");

  let timeSinceLastTest =
    (new Date().getTime() - parsed[0].Date.getTime()) / 1000;

  let dateOfLastTestMessage =
    dateOfLastTest + " (" + createTimeMessage(timeSinceLastTest, 1) + " ago)";

  document.getElementById("timeSinceLastSong").innerHTML =
    dateOfLastTestMessage;

  let byDay = getByDay(parsed);
  let lastTwoWeeks = getLastTwoWeeks(parsed);
  let byWeek = getAllWeeks(parsed);

  const dataToSave = { byDay, byWeek, lastTwoWeeks };

  return dataToSave;
}
