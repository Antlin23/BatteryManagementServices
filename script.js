//skriver ut värderna på sidan
function displayInfo(message) {
    //hämtar elementet och ändrar inehållet
    const displayArea = document.getElementById('displayArea');
    displayArea.innerHTML = `${message}\n`;
}

//hämtar elpris
async function getPricePerHour() {
    //anropar endpointen
    let res = await fetch("http://127.0.0.1:5000/priceperhour");
    //packar upp från json
    let data = await res.json();
    displayInfo("Price per hour: " + JSON.stringify(data));
}

//hämtar elförbrukning
async function getHouseholdBaseload() {
    let res = await fetch("http://127.0.0.1:5000/baseload");
    let data = await res.json();
    displayInfo("Consumption: " + JSON.stringify(data));
}

//skriver ut information om batteriet och hemmet
async function getInfo() {
    let res = await fetch("http://127.0.0.1:5000/info");
    let d = await res.json();
    
    let infoMessage = `Time: ${d.sim_time_hour}:${d.sim_time_min}\n` +
                     `Consumption: ${d.base_current_load}\n` +
                     `Charging: ${d.ev_battery_charge_start_stopp}\n` +
                     `Battery kWh: ${d.battery_capacity_kWh}`;
    
    displayInfo(infoMessage);
}

//startar eller stoppar laddning
async function setCharge(state) {
    let res = await fetch("http://127.0.0.1:5000/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        //i bodyn skickar vi med on eller off
        body: JSON.stringify({ charging: state })
    });
    let data = await res.json();
    displayInfo("Charging status: " + JSON.stringify(data));
}

//hämtar batteri procent från endpointen /charge
async function getBatteryPercentage() {
    let res = await fetch("http://127.0.0.1:5000/charge");
    let data = await res.json();
    displayInfo("Battery %: " + data + "%");
}

//laddar batteriet till 80%
async function autoCharge() {
    //startar laddningen
    await setCharge("on");
    //kollar varje sekund hur mycket batteriet är laddat
    let interval = setInterval(async () => {
        //hämtar batteriets procent
        let res = await fetch("http://127.0.0.1:5000/charge");
        let data = await res.json();
        //om batteriet är laddat till 80 stoppar vi laddningen
        if (data >= 80) {
            //avslutar loppen
            clearInterval(interval);
            //stänger av laddningen
            await setCharge("off");
        }
    }, 1000);

    displayInfo("Charging to 80%");
}

//laddar ur batteriet till 20%
async function dischargeBattery() {
    //anropar endpointen /discharge och sätter discharging till on via bodyn
    await fetch("http://127.0.0.1:5000/discharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discharging: "on" })
    });

    displayInfo("Discharged battery to 20%");
}



async function chargeLowestLoad() {
    let res = await fetch("http://127.0.0.1:5000/baseload");
    let base = await res.json();
    //minsta värdet i listan från endpointen
    let minHour = 0;
    //loopar igenom listan och hittar minsta värdet
    for (let i = 0; i < base.length; i++) {
        if (base[i] < base[minHour] && base[i] < 11.0) {
            minHour = i;
        }
    }
    displayInfo("Charging is set to start at the minimal consumption " + minHour);
    //anropar funktionen waitAndCharge med det minsta värdet
    waitAndCharge(minHour);
}


//laddar batteriet vid lägsta elpris
async function chargeLowestPrice() {
    let resP = await fetch("http://127.0.0.1:5000/priceperhour");
    let price = await resP.json();
    let resB = await fetch("http://127.0.0.1:5000/baseload");
    let base = await resB.json();
    let minHour = 0;
    //loppar igenom pristabellen och kollar om värdet är lägre än minHour och om elförbrukningen är lägre än 11
    for (let i = 0; i < price.length; i++) {
        if (price[i] < price[minHour] && base[i] < 11.0) {
            minHour = i;
        }
    }
    displayInfo("Charging is set to start at the minimal price " + minHour);
    waitAndCharge(minHour);

}

//anropas med tiden på dagen som laddningen ska starta och laddar tills batteriet är 80%
async function waitAndCharge(hourToCharge) {
    let charging = false;

    let timer = setInterval(async () => {
        let res = await fetch("http://127.0.0.1:5000/info");
        let d = await res.json();
        //räknar ut batteriets procent genom att dela batteriets procent med kapaciteten och multiplicera med 100
        let batt = d.battery_capacity_kWh / 46.3 * 100;

        //startar laddningen om det är rätt timme och elförbrukningen är under 11
        if (d.sim_time_hour == hourToCharge && d.base_current_load < 11 && !charging) {
            charging = true;
            await setCharge("on");
        }

        //om batteriet laddas och är minst 80 avslutar vi loopen och laddningen
        if (charging && batt >= 80) {
            await setCharge("off");
            clearInterval(timer);
        }
    }, 1000);

}
