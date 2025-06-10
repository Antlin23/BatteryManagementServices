async function getPricePerHour() {
    try {
        const response = await fetch('http://127.0.0.1:5000/priceperhour');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const priceData = await response.json();
        console.log('Prices per hour:', priceData);
    } catch (error) {
        console.error('Error fetching price data:', error);
        throw error;
    }
}

async function getHouseholdBaseload() {
    try {
        const response = await fetch('http://127.0.0.1:5000/baseload');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const baseloadData = await response.json();
        console.log('Household baseload:', baseloadData);
    } catch (error) {
        console.error('Error fetching baseload data:', error);
        throw error;
    }
}

async function getInfo() {
    try {
        const response = await fetch('http://127.0.0.1:5000/info');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const priceData = await response.json();
        console.log('Household baseload:', priceData);
    } catch (error) {
        console.error('Error fetching baseload data:', error);
        throw error;
    }
}

let chargingInterval = null;

async function setCharge(state) {
    try {
        const response = await fetch('http://127.0.0.1:5000/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ charging: state })
        });

        const result = await response.json();
        console.log(`Charging state set to: ${result.charging}`);
    } catch (error) {
        console.error('Error sending charge command:', error);
    }
}

async function getBatteryPercentageAndControlCharging() {
    try {
        const response = await fetch('http://127.0.0.1:5000/charge');
        const rawData = await response.json();

        let percent = typeof rawData === 'number'
            ? rawData
            : rawData.battery_percent || 0;

        percent = Math.min(100, parseFloat(percent));
        console.log(`Battery is at ${percent.toFixed(1)}%`);

        if (percent >= 80) {
            console.log("Battery reached 80%. Stopping charging.");
            clearInterval(chargingInterval);
            await setCharge("off");
        }
    } catch (err) {
        console.error('Error getting battery percentage:', err);
    }
}

async function startAutoCharging() {
    await setCharge("on");
    chargingInterval = setInterval(getBatteryPercentageAndControlCharging, 5000); // poll every 5 sec
}

async function dischargeBattery() {
    try {
        const response = await fetch('http://127.0.0.1:5000/discharge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ discharging: "on" })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Discharge response:', result);
    } catch (error) {
        console.error('Error sending discharge command:', error);
    }
}

