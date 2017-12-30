let currentRange = 0.5;
let currentInterval = 15;
let currentCoin = 'xrp';

getData = () => {
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url:
        '/aggregateData?range=' +
        currentRange +
        '&interval=' +
        currentInterval +
        '&coin=' +
        currentCoin,
      method: 'GET',
      dataType: 'json',
      success: data => {
        data = data.map(d => {
          d.intervalStart = new Date(d.intervalStart);
          d.intervalEnd = new Date(d.intervalEnd);
          return d;
        });
        data.sort((a, b) => {
          return a.intervalStart < b.intervalStart ? -1 : 1;
        });
        resolve(data);
      },
      error: err => {
        reject(err);
      }
    });
  });
};

plot = data => {
  const margins = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 250
  };

  const maxWidth = $('#chart').width() - 20;
  const maxHeight = $('#chart').height() - 20;

  const availableWidth = maxWidth - (margins.left + margins.right);
  const availableHeight = maxHeight - (margins.top + margins.bottom);

  const lastMilli = data[data.length - 1].intervalStart.getTime();
  const firstMilli = data[0].intervalStart.getTime();
  const pointCount = (lastMilli - firstMilli) / (1000 * 60 * currentInterval);
  const rectangleWidth = Math.min(availableWidth / pointCount, 115);

  const min = d3.min(data, d => {
    return Math.min(d.open, Math.min(d.close, Math.min(d.min, d.max)));
  });
  const max = d3.max(data, d => {
    return Math.max(d.open, Math.max(d.close, Math.max(d.max, d.max)));
  });

  const x_scale = d3.time
    .scale()
    .domain([data[0].intervalStart, data[data.length - 1].intervalEnd])
    .range([margins.left / 2, maxWidth - margins.right]);

  const y_scale = d3.scale
    .linear()
    .domain([min, max])
    .range([maxHeight - margins.bottom, margins.top]);

  const y_axis = d3.svg
    .axis()
    .scale(y_scale)
    .orient('left');

  const x_axis = d3.svg
    .axis()
    .scale(x_scale)
    .orient('bottom');

  var tooltip = d3.select('div.tooltip');

  d3.select('#chart svg').remove();

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('width', maxWidth)
    .attr('height', maxHeight);

  svg
    .append('g')
    .attr('transform', 'translate(' + margins.left / 3 + ',0)')
    .call(y_axis);

  svg
    .append('g')
    .attr(
      'transform',
      'translate(0, ' +
        (availableHeight + margins.top + margins.bottom / 2) +
        ')'
    )
    .call(x_axis);

  const rectangles = svg
    .append('g')
    .selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .on('mouseover', d => {
      tooltip
        .transition()
        .duration(500)
        .style('opacity', 0.9);

      const start = d.intervalStart;
      const end = d.intervalEnd;

      tooltip
        .html(
          '<p>' +
            (start.getHours() + ':' + start.getMinutes()) +
            ' - ' +
            (end.getHours() + ':' + end.getMinutes()) +
            '</p>' +
            '<p>Min: ' +
            d.min +
            '</p>' +
            '<p>Max: ' +
            d.max +
            '</p><p>Open: ' +
            d.open +
            '</p><p>Close: ' +
            d.close +
            '</p>'
        )
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY - 28 + 'px');
    })
    .on('mouseout', () => {
      tooltip
        .transition()
        .delay(500)
        .style('opacity', 0);
    })
    .attr('x', d => {
      return x_scale(d.intervalStart);
    })
    .attr('y', (d, i) => {
      return y_scale(Math.max(d.open, d.close));
    })
    .attr('width', rectangleWidth)
    .attr('height', d => {
      return Math.max(Math.abs(y_scale(d.open) - y_scale(d.close)), 1);
    })
    .attr('fill', d => {
      return d.open < d.close ? 'green' : 'red';
    });

  const whiskers = svg
    .append('g')
    .selectAll('line')
    .data(data)
    .enter();

  whiskers
    .append('line')
    .attr('x1', d => {
      const a = d.intervalStart;
      return x_scale(a) + rectangleWidth / 2;
    })
    .attr('y1', d => {
      return y_scale(d.max);
    })
    .attr('x2', d => {
      const a = d.intervalStart;
      return x_scale(a) + rectangleWidth / 2;
    })
    .attr('y2', d => {
      return y_scale(Math.max(d.open, d.close));
    })
    .attr('stroke-width', 1)
    .attr('stroke', 'gray');

  whiskers
    .append('line')
    .attr('x1', d => {
      const a = d.intervalStart;
      return x_scale(a) + rectangleWidth / 2;
    })
    .attr('y1', d => {
      return y_scale(d.min);
    })
    .attr('x2', d => {
      const a = d.intervalStart;
      return x_scale(a) + rectangleWidth / 2;
    })
    .attr('y2', d => {
      return y_scale(Math.min(d.open, d.close));
    })
    .attr('stroke-width', 1)
    .attr('stroke', 'gray');
};

loadData = () => {
  getData()
    .then(data => {
      plot(data);
    })
    .catch(err => {
      // Show error
    });
};

$(document).ready(() => {
  loadData();
});
