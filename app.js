const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const originalPeople = [
  { PersonID: 1, Name: 'Rachel Smith', Address: 'Wollaton', DOB: '1979-06-05', LicenseNumber: 'SG345PQ', ExpiryDate: '2020-05-05' },
  { PersonID: 2, Name: 'Lewis Thomson', Address: 'Nottingham', DOB: '1949-01-15', LicenseNumber: 'RW765FR', ExpiryDate: '2018-03-25' },
  { PersonID: 3, Name: 'Oliver Reps', Address: 'Nottingham', DOB: '1976-10-05', LicenseNumber: 'JR123DE', ExpiryDate: '2016-01-29' },
  { PersonID: 4, Name: 'Daphne Lai', Address: 'Leicester', DOB: '1980-08-13', LicenseNumber: 'DL890GB', ExpiryDate: '2017-06-24' },
  { PersonID: 5, Name: 'Rachel Johnson', Address: 'London', DOB: '2000-01-01', LicenseNumber: 'JK239GB', ExpiryDate: '2023-08-12' }
];

const originalVehicles = [
  { VehicleID: 'GHT56FN', Make: 'Fiat', Model: 'Punto', Colour: 'Blue', OwnerID: 4 },
  { VehicleID: 'KWK24JI', Make: 'Tesla', Model: '3', Colour: 'White', OwnerID: null },
  { VehicleID: 'NG51PKO', Make: 'Ford', Model: 'Fiesta', Colour: 'Grey', OwnerID: 1 },
  { VehicleID: 'PQR6465', Make: 'Audi', Model: 'A4', Colour: 'Red', OwnerID: 2 },
  { VehicleID: 'SFD43FH', Make: 'Lancia', Model: 'Thema', Colour: 'Blue', OwnerID: 3 }
];

let selectedOwnerID = null;

function value(id) {
  return document.getElementById(id).value.trim();
}

function showMessage(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

function showPerson(person, container, includeButton) {
  const div = document.createElement('div');
  div.textContent = `personid: ${person.PersonID} name: ${person.Name} address: ${person.Address} dob: ${person.DOB} licensenumber: ${person.LicenseNumber} expirydate: ${person.ExpiryDate}`;

  if (includeButton) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Select owner';
    button.addEventListener('click', function () {
      selectedOwnerID = person.PersonID;
      showMessage('message-owner', 'Owner selected');
    });
    div.appendChild(document.createElement('br'));
    div.appendChild(button);
  }

  container.appendChild(div);
}

function showVehicle(vehicle, owner, container) {
  const div = document.createElement('div');
  let text = `rego: ${vehicle.VehicleID} make: ${vehicle.Make} model: ${vehicle.Model} colour: ${vehicle.Colour}`;
  if (owner) {
    text += ` owner: ${owner.Name} licensenumber: ${owner.LicenseNumber}`;
  } else {
    text += ' owner: unknown';
  }
  div.textContent = text;
  container.appendChild(div);
}

async function searchPeopleByName(name) {
  return await client.from('People').select('*').ilike('Name', `%${name}%`).order('PersonID');
}

async function searchPeopleByLicense(license) {
  return await client.from('People').select('*').ilike('LicenseNumber', `%${license}%`).order('PersonID');
}

async function resetDatabase() {
  await client.from('Vehicles').delete().neq('VehicleID', '');
  await client.from('People').delete().gt('PersonID', 0);
  await client.from('People').insert(originalPeople);
  await client.from('Vehicles').insert(originalVehicles);
  showMessage('message', 'Database reset');
  showMessage('message-owner', 'Database reset');
  showMessage('message-vehicle', 'Database reset');
}

async function setupPeopleSearch() {
  const form = document.getElementById('people-form');
  if (!form) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const name = value('name');
    const license = value('license');
    const results = document.getElementById('results');
    results.innerHTML = '';

    if ((name === '' && license === '') || (name !== '' && license !== '')) {
      showMessage('message', 'Error');
      return;
    }

    const response = name !== '' ? await searchPeopleByName(name) : await searchPeopleByLicense(license);
    if (response.error) {
      showMessage('message', 'Error');
      return;
    }

    if (response.data.length === 0) {
      showMessage('message', 'No result found');
      return;
    }

    response.data.forEach(function (person) {
      showPerson(person, results, false);
    });
    showMessage('message', 'Search successful');
  });
}

async function setupVehicleSearch() {
  const form = document.getElementById('vehicle-form');
  if (!form) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const rego = value('rego');
    const results = document.getElementById('results');
    results.innerHTML = '';

    if (rego === '') {
      showMessage('message', 'Error');
      return;
    }

    const vehicleResponse = await client.from('Vehicles').select('*').ilike('VehicleID', rego);
    if (vehicleResponse.error) {
      showMessage('message', 'Error');
      return;
    }

    if (vehicleResponse.data.length === 0) {
      showMessage('message', 'No result found');
      return;
    }

    for (const vehicle of vehicleResponse.data) {
      let owner = null;
      if (vehicle.OwnerID !== null) {
        const ownerResponse = await client.from('People').select('*').eq('PersonID', vehicle.OwnerID).single();
        owner = ownerResponse.data;
      }
      showVehicle(vehicle, owner, results);
    }
    showMessage('message', 'Search successful');
  });
}

function setupAddVehicle() {
  const form = document.getElementById('add-vehicle-form');
  if (!form) return;

  const ownerInput = document.getElementById('owner');
  const checkButton = document.getElementById('check-owner');
  const newOwnerButton = document.getElementById('new-owner');
  const ownerForm = document.getElementById('owner-form');

  ownerInput.addEventListener('input', function () {
    checkButton.disabled = ownerInput.value.trim() === '';
  });

  checkButton.addEventListener('click', async function () {
    const ownerResults = document.getElementById('owner-results');
    ownerResults.innerHTML = '';
    selectedOwnerID = null;
    const response = await searchPeopleByName(value('owner'));

    if (response.error) {
      showMessage('message-owner', 'Error');
      return;
    }

    if (response.data.length === 0) {
      showMessage('message-owner', 'No result found');
    } else {
      response.data.forEach(function (person) {
        showPerson(person, ownerResults, true);
      });
      showMessage('message-owner', 'Search successful');
    }

    newOwnerButton.disabled = false;
  });

  newOwnerButton.addEventListener('click', function () {
    ownerForm.hidden = false;
  });

  ownerForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const newOwner = {
      Name: value('name'),
      Address: value('address'),
      DOB: value('dob'),
      LicenseNumber: value('license'),
      ExpiryDate: value('expire')
    };

    if (Object.values(newOwner).includes('')) {
      showMessage('message-owner', 'Error');
      return;
    }

    const duplicate = await client.from('People').select('*')
      .eq('Name', newOwner.Name)
      .eq('Address', newOwner.Address)
      .eq('DOB', newOwner.DOB)
      .eq('LicenseNumber', newOwner.LicenseNumber)
      .eq('ExpiryDate', newOwner.ExpiryDate);

    if (duplicate.error || duplicate.data.length > 0) {
      showMessage('message-owner', 'Error');
      return;
    }

    const insert = await client.from('People').insert(newOwner).select().single();
    if (insert.error) {
      showMessage('message-owner', 'Error');
      return;
    }

    selectedOwnerID = insert.data.PersonID;
    showMessage('message-owner', 'Owner added successfully');
  });

  document.getElementById('add-vehicle').addEventListener('click', async function () {
    const newVehicle = {
      VehicleID: value('rego'),
      Make: value('make'),
      Model: value('model'),
      Colour: value('colour'),
      OwnerID: selectedOwnerID
    };

    if (newVehicle.VehicleID === '' || newVehicle.Make === '' || newVehicle.Model === '' || newVehicle.Colour === '' || newVehicle.OwnerID === null) {
      showMessage('message-vehicle', 'Error');
      return;
    }

    const insert = await client.from('Vehicles').insert(newVehicle);
    if (insert.error) {
      showMessage('message-vehicle', 'Error');
      return;
    }

    showMessage('message-vehicle', 'Vehicle added successfully');
  });
}

const resetButton = document.getElementById('reset');
if (resetButton) {
  resetButton.addEventListener('click', resetDatabase);
}

setupPeopleSearch();
setupVehicleSearch();
setupAddVehicle();
