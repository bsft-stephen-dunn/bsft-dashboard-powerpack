/**
 * Main function that created campaign pages's content
 */
function campaignHandler(){
    extconsole.log('campaignHandler:start')
    fetch(chrome.extension.getURL('routes/campaigns/index.html'))
    .then(response => response.text())
    .then(html => {
        jQuery( ".content" ).prepend(html)
        $("#btnPieChart").click(function() {
            var clicks = $('#ng-app-body > div.app-root.ng-scope > div > div > div > div.pos-rel.ng-scope > div.ng-scope > div > report.metric-grid-border.ng-scope.ng-isolate-scope > div:nth-child(2) > div.report-wrapper > div.overflow-hidden.ng-scope > div > div > div > metric-grid > div > div:nth-child(1) > div > div.metric-grid-item-value.mar-b-3.pad-x-2.ng-binding').text()
            var impressions = $('#ng-app-body > div.app-root.ng-scope > div > div > div > div.pos-rel.ng-scope > div.ng-scope > div > report.metric-grid-border.ng-scope.ng-isolate-scope > div:nth-child(2) > div.report-wrapper > div.overflow-hidden.ng-scope > div > div > div > metric-grid > div > div:nth-child(3) > div > div.metric-grid-item-value.mar-b-3.pad-x-2.ng-binding').text()
            var delivered = $('#ng-app-body > div.app-root.ng-scope > div > div > div > div.pos-rel.ng-scope > div.ng-scope > div > report.metric-grid-border.ng-scope.ng-isolate-scope > div:nth-child(2) > div.report-wrapper > div.overflow-hidden.ng-scope > div > div > div > metric-grid > div > div:nth-child(2) > div > div.metric-grid-item-value.mar-b-3.pad-x-2.ng-binding').text()
            var sends = $('#ng-app-body > div.app-root.ng-scope > div > div > div > div.pos-rel.ng-scope > div.ng-scope > div > report.metric-grid-border.ng-scope.ng-isolate-scope > div:nth-child(2) > div.report-wrapper > div.overflow-hidden.ng-scope > div > div > div > metric-grid > div > div.metric-grid-item.ng-scope.clickable.selected > div > div.metric-grid-item-value.mar-b-3.pad-x-2.ng-binding').text()
            console.log('delivered',cleanMetrics(clicks),cleanMetrics(impressions),cleanMetrics(delivered),cleanMetrics(sends))
            var options = {
                title: {
                    text: "Campaign Performance"
                },
                data: [{
                        type: "pie",
                        startAngle: 45,
                        showInLegend: "true",
                        legendText: "{label}",
                        indexLabel: "{label} ({y})",
                        yValueFormatString:"#,##0.#"%"",
                        dataPoints: [
                            { label: "Clicks", y: cleanMetrics(clicks) },
                            { label: "Delivered", y: cleanMetrics(delivered) },
                            { label: "Impressions", y: cleanMetrics(impressions) },
                            { label: "Sends", y: cleanMetrics(sends) }
                        ]
                }]
            };
            $('#chartContainer').attr('style','height: 370px; width: 100%;');
            $("#chartContainer").CanvasJSChart(options);
        });
    }).catch(err => {
        extconsole.error('campaignHandler:',err)
    }); 
}

/**
 * Convert string representation of metric to a number
 * - Examples:-
 *         7K -> 7000
 *         1M -> 1000000
 * @param {string} metric 
 * @returns {number} metric
 */
function cleanMetrics(metric){
    metric = metric.trim()
    if (metric.indexOf('K') > -1) {
        return metric.replace('K','') * 1000
    }
    if (metric.indexOf('M') > -1) {
        return metric.replace('M','') * 1000000
    }
    return metric
}