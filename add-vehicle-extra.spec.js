// @ts-check
const { test, expect } = require('@playwright/test');

const websiteURL = 'http://127.0.0.1:3000/add-vehicle.html';

test.beforeEach(async ({ page }) => {
  await page.goto(websiteURL);
});

test('add vehicle correctly with a new owner', async ({ page }) => {
  await page.locator('#rego').fill('LKJ23UO');
  await page.locator('#make').fill('Porsche');
  await page.locator('#model').fill('Taycan');
  await page.locator('#colour').fill('white');
  await page.locator('#owner').fill('Kai');
  await page.getByRole('button', { name: 'Check owner' }).click();
  await page.getByRole('button', { name: 'New owner' }).click();
  await page.locator('#name').fill('Kai');
  await page.locator('#address').fill('Edinburgh');
  await page.locator('#dob').fill('1990-01-01');
  await page.locator('#license').fill('SD876ES');
  await page.locator('#expire').fill('2030-01-01');
  await page.getByRole('button', { name: 'Add owner' }).click();
  await expect(page.locator('#message-owner')).toContainText('Owner added successfully');
  await page.getByRole('button', { name: 'Add vehicle' }).click();
  await expect(page.locator('#message-vehicle')).toContainText('Vehicle added successfully');
});

test('new owner cannot be saved with missing fields', async ({ page }) => {
  await page.locator('#owner').fill('Kai');
  await page.getByRole('button', { name: 'Check owner' }).click();
  await page.getByRole('button', { name: 'New owner' }).click();
  await page.locator('#name').fill('Kai');
  await page.locator('#address').fill('Edinburgh');
  await page.getByRole('button', { name: 'Add owner' }).click();
  await expect(page.locator('#message-owner')).toContainText('Error');
});

test('new owner cannot be exactly the same as an existing owner', async ({ page }) => {
  await page.locator('#owner').fill('Rachel');
  await page.getByRole('button', { name: 'Check owner' }).click();
  await page.getByRole('button', { name: 'New owner' }).click();
  await page.locator('#name').fill('Rachel Smith');
  await page.locator('#address').fill('Wollaton');
  await page.locator('#dob').fill('1979-06-05');
  await page.locator('#license').fill('SG345PQ');
  await page.locator('#expire').fill('2020-05-05');
  await page.getByRole('button', { name: 'Add owner' }).click();
  await expect(page.locator('#message-owner')).toContainText('Error');
});

test('vehicle cannot be saved if required vehicle details are missing', async ({ page }) => {
  await page.locator('#owner').fill('Rachel');
  await page.getByRole('button', { name: 'Check owner' }).click();
  await page.getByRole('button', { name: 'Select owner' }).first().click();
  await page.locator('#rego').fill('AAA11AA');
  await page.locator('#make').fill('Ford');
  await page.getByRole('button', { name: 'Add vehicle' }).click();
  await expect(page.locator('#message-vehicle')).toContainText('Error');
});

test('check owner button is disabled until owner field is filled', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Check owner' })).toBeDisabled();
  await page.locator('#owner').fill('Rachel');
  await expect(page.getByRole('button', { name: 'Check owner' })).toBeEnabled();
});
