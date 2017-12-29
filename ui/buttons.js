const buttons = {
  currencyButtons: [
    {
      id: 'btc',
      text: 'BTC'
    },
    {
      id: 'eth',
      text: 'ETH'
    },
    {
      id: 'xrp',
      text: 'XRP'
    },
    {
      id: 'ltc',
      text: 'LTC'
    },
    {
      id: 'bch',
      text: 'BCH'
    }
  ],
  ranges: [0.5, 1, 3, 7, 30, 90, 180, 360],
  intervals: [5, 15, 30, 60, 120, 240, 1440]
};

$(document).ready(() => {
  const currBtns = d3
    .select('#buttons')
    .append('div')
    .append('div')
    .attr('class', 'btn-group');
  for (const i in buttons.currencyButtons) {
    currBtns
      .append('button')
      .attr('class', 'btn btn-primary')
      .attr('id', buttons.currencyButtons[i].id)
      .text(buttons.currencyButtons[i].text)
      .on('click', () => {
        currentCoin = buttons.currencyButtons[i].id;
        loadData();
      });
  }

  const rangeBtns = d3.select('#buttons').append('div');
  rangeBtns.append('span').text('Range (days): ');
  const rangeBtnGrp = rangeBtns.append('div').attr('class', 'btn-group');
  for (const i in buttons.ranges) {
    rangeBtnGrp
      .append('button')
      .attr('class', 'btn btn-default')
      .text(buttons.ranges[i])
      .on('click', () => {
        currentRange = buttons.ranges[i];
        loadData();
      });
  }

  const intervalBtns = d3.select('#buttons').append('div');
  intervalBtns.append('span').text('Interval (minutes): ');
  const intervalBtnGrp = intervalBtns.append('div').attr('class', 'btn-group');
  for (const i in buttons.intervals) {
    intervalBtnGrp
      .append('button')
      .attr('class', 'btn btn-default')
      .text(buttons.intervals[i])
      .on('click', () => {
        currentInterval = buttons.intervals[i];
        loadData();
      });
  }
});
