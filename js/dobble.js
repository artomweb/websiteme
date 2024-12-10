let dobbleToggleState = 0;
let dobbleData = {};
let dobbleChart;

function switchdobbleDots() {
  const circles = Array.from(document.getElementsByClassName("dobbleCircles"));
  const desc = document.getElementById("dobbleDesc");

  switch (dobbleToggleState) {
    case 0:
      desc.innerHTML =
        'I made <a href="https://dobble.artomweb.com">this</a> game to see if I can get better at playing Dobble. Can you beat my score?';
      break;
    case 1:
      desc.innerHTML =
        "This graph shows my average score at each hour of the day.";
      break;
  }
  circles.forEach((c) =>
    c.id.slice(-1) == dobbleToggleState
      ? (c.style.fill = "black")
      : (c.style.fill = "none")
  );
}

function dobbleToggle() {
  switchdobbleDots();
  switch (dobbleToggleState) {
    case 0:
      updatedobbleNormal();
      break;

    case 1:
      updatedobblePerHour();
      break;
  }
  dobbleToggleState == 1 ? (dobbleToggleState = 0) : dobbleToggleState++;
}

function parseDobble(data) {
  const fallbackUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQwLrwjE_FFzRj2Sq9S3-8MQDfpnGchacJGkM1s6Oidsswu82E4jBewlVWCNA4CwW9K3EauyYYlNfTL/pub?output=csv";

  // Attempt to process the provided JSON data
  try {
    processDobble(data); // Pass the relevant part of the data
  } catch (error) {
    console.log(
      "Error processing dobble data, trying the fallback URL:",
      error
    );
    parseCSV(fallbackUrl); // Fall back to CSV if processing fails
  }

  // Function to parse CSV data with PapaParse for the fallback URL
  function parseCSV(url) {
    Papa.parse(url, {
      download: true,
      header: true,
      complete: function (results) {
        try {
          processDobble(results.data); // Process the CSV data
        } catch (error) {
          console.log("Error processing fallback CSV data:", error);
          const dobbleCard = document.getElementById("dobbleCard");
          dobbleCard.style.display = "none"; // Hide the card if processing fails
        }
      },
      error: function (error) {
        console.log("Failed to fetch data from CSV URL:", error);
        const dobbleCard = document.getElementById("dobbleCard");
        dobbleCard.style.display = "none"; // Hide the card if fetching fails
      },
    });
  }
}

function updatedobbleNormal() {
  const { labels, data } = dobbleData;

  dobbleChart.options.scales.x = {
    ticks: {
      autoSkip: true,
      maxTicksLimit: 5.1,
    },
  };

  dobbleChart.options.scales.y = {
    title: {
      text: "Average Score",
      display: true,
    },
    beginAtZero: true,
  };

  dobbleChart.options.plugins.tooltip.callbacks.title = function (tooltipItem) {
    return tooltipItem[0].label;
  };

  dobbleChart.data.labels = labels;
  dobbleChart.data.datasets = [
    {
      data: data,
      backgroundColor: "#8ecae6",
      tension: 0.1,
      fill: true,
    },
  ];

  dobbleChart.update();
}

function updatedobblePerHour() {
  const { timOfDayLabels, timOfDayData, pointRadiusArray } = dobbleData;

  dobbleChart.options.scales.x = {
    type: "linear",
    position: "bottom",
    ticks: {
      stepSize: 1,
      callback: function (value, index, values) {
        return `${value}:00`;
      },
    },
  };

  dobbleChart.options.scales.y = {
    title: {
      text: "Average score",
      display: true,
    },
    beginAtZero: true,
  };

  dobbleChart.options.plugins.tooltip.callbacks.title = function (tooltipItem) {
    return tooltipItem[0].label + ":00";
  };

  dobbleChart.data.labels = timOfDayLabels;
  dobbleChart.data.datasets = [
    {
      data: timOfDayData,
      backgroundColor: "#8ecae6",
      tension: 0.1,
      fill: true,
      pointRadius: pointRadiusArray,
    },
  ];

  dobbleChart.update();
}

function processDobble(dataIn) {
  updateDobbleData(dataIn);

  plotDobble();

  dobbleToggle();
}

function updateDobbleData(dataIn) {
  let totalTime = 0;
  dataIn.forEach((elt) => {
    elt.timestamp = new Date(+elt.unix * 1000);
    elt.score = +elt.score;
    totalTime += +elt.testTime;
  });

  const numTests = dataIn.length;

  const weekAvg = _.chain(dataIn)
    .groupBy((d) => {
      const date = new Date(d.timestamp);
      return new Intl.DateTimeFormat("en-GB", {
        month: "short",
        year: "2-digit",
      }).format(date);
    })
    .map((entries, mofy) => {
      return {
        mofy,
        avg: Math.round(_.meanBy(entries, (entry) => entry.score) * 10) / 10,
        // avg: Math.round(_.maxBy(entries, "score").score * 10) / 10,
      };
    })
    .value();

  const labels = weekAvg.map((el) => el.mofy);
  const data = weekAvg.map((el) => el.avg);

  const hoursOfDay = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const byTimeOfDay = _.chain(dataIn)
    .groupBy((d) => {
      const date = new Date(d.timestamp);
      return date.getHours().toString().padStart(2, "0"); // Format hour as "HH"
    })
    .map((entries, hour) => {
      return {
        hour: +hour,
        avg: Math.round(_.meanBy(entries, (entry) => +entry.score) * 10) / 10,
        // avg: Math.round(_.maxBy(entries, "score").score * 10) / 10,
        // avg: entries.length,
      };
    })
    .sortBy((d) => d.hour)
    .value();

  const completedByTimeOfDay = _.map(hoursOfDay, (hour) => {
    const existingHourData = byTimeOfDay.find(
      (item) => item.hour === parseInt(hour)
    );
    return existingHourData || { hour: +hour, avg: 0 };
  });

  const timOfDayLabels = completedByTimeOfDay.map((item) => item.hour);
  const timOfDayData = completedByTimeOfDay.map((item) => item.avg);

  const pointRadiusArray = completedByTimeOfDay.map((item) =>
    item.avg !== 0 ? 3 : 0
  );

  const scorePoints = dataIn.map((point) => +point.score);

  const trend = findLineByLeastSquares(scorePoints);

  const scoreChange = trend[1][1] - trend[0][1];

  const delta = dataIn.length * 60;

  const changeInScorePerMinSigned = (scoreChange * (3600 / delta)).toFixed(2);

  const PorNchange = changeInScorePerMinSigned > 0 ? "+" : "-";

  const changeInScorePerMin = Math.abs(changeInScorePerMinSigned);

  const maxScore = _.maxBy(dataIn, "score").score;
  const timeMessage = Math.round(totalTime / (60 * 60)) + " hours";

  const lastTimestamp = dataIn[dataIn.length - 1].timestamp;
  const date = new Date(lastTimestamp);

  const dateOfLastTest = formatDate(lastTimestamp);

  const dateOfLastTestMessage =
    dateOfLastTest +
    " (" +
    timeago(new Date(+dataIn[dataIn.length - 1].timestamp)) +
    ")";

  document.getElementById("dobbleScoreChangePerHour").innerHTML =
    PorNchange + changeInScorePerMin;

  document.getElementById("dobbleTime").innerHTML = timeMessage;

  document.getElementById("highestDobble").innerHTML = maxScore;
  document.getElementById("numberDobble").innerHTML = numTests;

  document.getElementById("timeSinceLastDobble").innerHTML =
    dateOfLastTestMessage;

  dobbleData = {
    labels,
    data,
    timOfDayLabels,
    timOfDayData,
    pointRadiusArray,
  };

  // console.log(maxScore);
}

function plotDobble() {
  const ctx = document.getElementById("dobbleChart").getContext("2d");

  config = {
    type: "line",
    data: {
      // labels: labels,
      // datasets: [
      //   {
      //     tension: 0.3,
      //     // borderColor: "black",
      //     data: data,
      //     backgroundColor: "#8ecae6",
      //     fill: true,
      //   },
      // ],
    },

    options: {
      maintainAspectRatio: true,
      responsive: true,

      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";

              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += "Average: " + context.parsed.y;
              }
              return label;
            },

            title: function (context) {
              const title = context[0].label;
              return title;
            },
          },
        },
      },
      scales: {
        y: {
          title: {
            text: "Average score",
            display: true,
          },
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },

        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 5.1,
          },
        },
      },
    },
  };
  dobbleChart = new Chart(ctx, config);
}
