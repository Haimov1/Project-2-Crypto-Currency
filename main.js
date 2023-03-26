/// <reference path="jquery-3.6.1.js" />

"use strict";

$(() => {
    $("#currenciesLink").click(displayCoins);
    $("#reportsLink").click(liveReport);
    $("#aboutLink").click(aboutMe);

    // Value from the api.
    let coins;

    // Search input value.
    let searchCoinByUser;

    // Coins to tracking.
    let trackingCoins = [];

    // Graph display in live report div.
    let graph = {};

    // SetInterval.
    let intervalId;

    // Current value of tracking coins.
    let currentTrackingCoinsPrices = {};

    // Save coins list to local storage for two minute.
    function saveCoinsListToLocalStorage() {
        if (!localStorage.getItem("coins")) {
            const saveCoinsList = JSON.stringify(coins);
            localStorage.setItem("coins", saveCoinsList);
            setTimeout(() => localStorage.removeItem("coins"), 1000 * 60 * 2);
        }
    }

    // Load coins data from local storage to more info button.
    function loadCoinsListFromStorage() {
        const currentCoins = localStorage.getItem("coins");
        if (currentCoins) {
            coins = JSON.parse(currentCoins);
        }
        else {
            loadCoins();
        }
    }

    async function getJson(url) {
        try {
            const response = await fetch(url);
            const json = await response.json();
            return json;
        }
        catch (err) {
            alert("We were unable to receive a response from the requested address, please try again later.");
        }
    }

    // Get data of coins from api.
    async function loadCoins() {
        try {
            const result = await getJson("https://api.coingecko.com/api/v3/coins");
            coins = result;
            // Happened on the first time page load.
            displayCoins();
            saveCoinsListToLocalStorage();
        }
        catch {
            alert("The data for the requested URL is currently unavailable, please try again later.");
        }
    }

    // Happened on the first time page load.
    loadCoins();

    // Receives information from the data entered into the input by the user.
    $("#searchCoinsButton").click(() => {
        const clientValue = $("#boxSearch").val();

        // Searching coins from the list.
        searchCoinByUser = coins.filter(coins => coins.symbol.toUpperCase() === clientValue.toUpperCase());
        $("#boxSearch").val(null);
        displayCoins();
    });

    function displayCoins() {
        // stopping the interval.
        clearInterval(intervalId);

        // Current Coins is the coins list or the coin the user was looking for.
        let currentCoins;
        if (searchCoinByUser === undefined) {
            currentCoins = coins;
        }
        else if (searchCoinByUser.length === 0) {
            currentCoins = coins;
            alert("This symbol is not defined, please try again.");
        }
        else {
            currentCoins = searchCoinByUser;
        }

        // Cleaner div.
        $("#contentDiv").empty();
        $("#liveReport").empty();

        // If the information about the coins has not yet been uploaded, a spinner is displayed to load the page.
        if (currentCoins) {
            setTimeout(() => {
                // Spinner stop.
                $(`.spinner-border`).css("display", "none");
            }, 400);
        }

        // HTML is the value who entered to the content div.
        let html = "";

        // display all coins or selected coin.
        for (const coin of currentCoins) {
            let currentCoin;

            // Check if this current is on tracking.
            if (trackingCoins) {
                currentCoin = trackingCoins.find(currentCoin => currentCoin.id === coin.id);
            }
            html += `
            <div class="card">
            <div class="form-check form-switch toggle-side">`

            // If this currency is on a watch list, the toggle button lights up else the toggle button is off.
            if (currentCoin) {
                html += `<input id="toggle-${coin.id}" class="form-check-input toggleInput" type="checkbox" role="switch" checked>`
            }
            else {
                html += `<input id="toggle-${coin.id}" class="form-check-input toggleInput" type="checkbox" role="switch">`
            }
            html += `
                </div>
                <div class="nameCard">
               Symbol: ${coin.symbol}
                <br>
                Name: ${coin.name}
                </div>
                <button class="btn btn-primary openData" type="button" data-bs-toggle="collapse"
                data-bs-target="#${coin.id}" aria-expanded="false" aria-controls="collapseExample">More Info</button>
                    <div class="collapse" id=${coin.id}>
                        <div class="card-body">
                            <img src="${coin.image.thumb}">
                            <br />
                           USD: ${coin.market_data.current_price.usd} $
                            <br />
                           EUR: ${coin.market_data.current_price.eur} €
                            <br />
                           ILS: ${coin.market_data.current_price.ils} ₪
                        </div>
                    </div>
                </div>`;
        }

        // Push the variable to the content div.
        $("#contentDiv").append(html);

        // Call to toggle button.
        $(".toggleInput").click(function () {
            let coinsById;
            if (trackingCoins) {
                // Searching From list of coins by id. & Use substring to delete the "toggle-" from the id.
                coinsById = trackingCoins?.find(coin => coin.id === this.id.substring(7, this.id.length));
            }

            if (coinsById === undefined && (trackingCoins === null || trackingCoins.length < 5)) {
                if (trackingCoins === null) {
                    trackingCoins = [];
                }
                let selectedCoin = coins.find(coin => coin.id === this.id.substring(7, this.id.length));
                trackingCoins.push(selectedCoin);
                saveSelectedCoinsListToLocalStorage();
            }
            else if (coinsById && trackingCoins.length <= 5) {
                // find the index of the current coin from the list.
                let index = trackingCoins.findIndex(coin => coin.id === this.id.substring(7, this.id.length));
                if (index > -1) {
                    trackingCoins.splice(index, 1);
                    localStorage.removeItem("trackingCoins");
                }
                saveSelectedCoinsListToLocalStorage();
            }
            else {
                // This dialog appears provided there are five coins in the watch list.
                let dialog = `
                <button type="button" id="btnModal" data-bs-toggle="modal" data-bs-target="#exampleModal"></button>
                <div class="modal fade" id="exampleModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="exampleModalLabel">My selected coins</h5>
                            </div>
                            <div class="form-check form-switch" id="popModal">`
                // Pushes the tracked coins into the dialog.
                for (const trackingCoin of trackingCoins) {
                    dialog += `
                    <label class="switch-modal">${trackingCoin.id}
                    <input id="${trackingCoin.id}" class="form-check-input" type="checkbox" role="switch" checked>
                    </label>
                    <br />`
                }
                dialog += ` 
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="closeButton" data-bs-dismiss="modal">Close</button>
                                <button type="button" data-bs-dismiss="modal" class="btn btn-primary saveButton">Save changes</button>
                            </div>
                        </div>
                    </div>
                </div> `

                // Push to the popup.
                $('#contentDiv').append(dialog);
                // Open popup to change tracking coins.
                $("#btnModal").click();

                // This array will keep the coins that we track others and want to remove.
                let index = [];

                // Pushes the tracked coin into the index(array).
                $("#contentDiv").on('click', '.switch-modal > input', function () {
                    index.push(trackingCoins.findIndex(coin => coin.id === this.id));
                })

                // Changing the new tracking coins.
                $(".saveButton").click(() => {
                    for (let i = 0; i < index.length; i++) {
                        if (index[i] > -1) {
                            trackingCoins.splice(index[i], 1);
                        }
                    }
                    if (trackingCoins.length < 5) {
                        let newCoinToSave = coins.find(coin => coin.id === this.id.substring(7, this.id.length));
                        trackingCoins.push(newCoinToSave);
                    }
                    else {
                        alert("you can tracking max at 5 coins.")
                    }
                    index = [];
                    saveSelectedCoinsListToLocalStorage();
                    displayCoins();
                })

                // Canceling the change of the tracked currencies.
                $(".closeButton").click(() => displayCoins());
            }
        });

        // Reset input search value and current coins.
        searchCoinByUser = undefined;
        currentCoins = undefined;

        // Open more data about current coin.
        $(".openData").click(function () {
            if ($(this).attr("aria-expanded") === "true") {
                saveCoinsListToLocalStorage();
                loadCoinsListFromStorage();
            }
        });
    }

    // Save the tracking coins list to local storage.
    function saveSelectedCoinsListToLocalStorage() {
        const selectedCoins = JSON.stringify(trackingCoins);
        localStorage.setItem("trackingCoins", selectedCoins);
    }

    // Load the tracking coins list from local storage.
    function loadSelectedCoinsListFromLocalStorage() {
        const selectedCoins = localStorage.getItem("trackingCoins");
        trackingCoins = JSON.parse(selectedCoins);
    }
    loadSelectedCoinsListFromLocalStorage();

    // Data of canvas.
    function liveReport() {
        // Cleaner div.
        $("#contentDiv").empty();

        // Spinner is displayed to load the canvas.
        $(`.spinner-border`).css("display", "block");

        // Graph to pained on canvas.
        graph = {
            height: 500,
            exportEnabled: true,
            animationEnabled: true,
            theme: "dark2",
            title: {
                text: "Live Reports",
                margin: 50
            },
            axisX: {
                title: "Current time in seconds",
                valueFormatString: "DDD HH:mm:ss"
            },
            axisY: {
                title: "Coin Prices USD",
                titleFontColor: "#4F81BC",
                lineColor: "#4F81BC",
                labelFontColor: "#4F81BC",
                tickColor: "#4F81BC"
            },
            toolTip: {
                shared: true
            },
            legend: {
                cursor: "pointer",
            },
        }
        // If there are no coins to track then a message is printed accordingly.
        if (trackingCoins !== null && trackingCoins?.length !== 0) {
            // Getting coins name from tracking coins.
            const symbolNames = trackingCoins.map(result => result.symbol).toString().toUpperCase();

            // Getting new value every 2 seconds.
            intervalId = setInterval(() => {
                $.ajax({
                    url: `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbolNames},&tsyms=USD&api_key=3bfa7f556da519b27cbafcb531427f9b213cd378d19a8e8927638e8ac9fb578a`,
                    success: data => {
                        paintGraphOnCanvas(data);
                    },
                    error: err => alert("Error: " + err.status)
                });
            }, 2000);
        }
        else {
            // stopping the interval.
            clearInterval(intervalId);

            // Spinner stop.
            $(`.spinner-border`).css("display", "none");
            
            $("#liveReport").append("No currencies selected for tracking. Please select coins to display.");
        }
    }

    // Paint on canvas and update values data in the graph.
    function paintGraphOnCanvas(data) {
        let graphData = [];
        for (const [key, value] of Object.entries(data)) {
            if (currentTrackingCoinsPrices[key.toLowerCase()]) {
                currentTrackingCoinsPrices[key.toLowerCase()].push({ x: new Date(), y: value["USD"] });
            }
            else {
                currentTrackingCoinsPrices[key.toLowerCase()] = [{ x: new Date(), y: value["USD"] }];
            }
        }
        trackingCoins.forEach(coin => {
            graphData.push(
                {
                    type: "spline",
                    name: coin.name,
                    showInLegend: true,
                    yValueFormatString: `${coin.market_data.current_price.usd}`,
                    dataPoints: currentTrackingCoinsPrices[coin.symbol]
                });
        });

        graph.data = graphData;

        // Spinner stop.
        $(`.spinner-border`).css("display", "none");

        // Paint.
        $("#liveReport").CanvasJSChart(graph);
    }

    // About me.
    function aboutMe() {
        // stopping the interval
        clearInterval(intervalId);

        // Spinner stop.
        $(`.spinner-border`).css("display", "none");

        // Cleaner div.
        $("#contentDiv").empty();
        $("#liveReport").empty();

        $("#contentDiv").append(`<div class="imgAboutMe">
        <img src="./assets/images/About-me.png" />
        </div>`);
    }
});