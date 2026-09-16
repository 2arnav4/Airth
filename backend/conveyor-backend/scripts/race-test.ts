/**
 * Simulates the assignment's core scenario: several browser tabs all try to
 * move the same pending job to running at the same moment.
 *
 * Exactly one request must win with 200. Every other request must get 409.
 *
 * Usage (server must be running):
 *   bun scripts/race-test.ts
 *   bun scripts/race-test.ts https://your-api.onrender.com 10
 */

const baseUrl = process.argv[2] ?? 'http://localhost:3000';
const attempts = Number(process.argv[3] ?? 5);

const json = { 'Content-Type': 'application/json' };

async function main() {
  const createResponse = await fetch(`${baseUrl}/jobs`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ title: 'Race test job', type: 'test' }),
  });

  if (!createResponse.ok) {
    throw new Error(`Could not create job: ${createResponse.status}`);
  }

  const job = (await createResponse.json()) as { id: string; status: string };
  console.log(`Created job ${job.id} with status "${job.status}"`);
  console.log(`Firing ${attempts} concurrent requests to set status=running\n`);

  // Promise.all starts every request before awaiting any of them, so they
  // reach the server at nearly the same instant.
  const responses = await Promise.all(
    Array.from({ length: attempts }, () =>
      fetch(`${baseUrl}/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: json,
        body: JSON.stringify({ status: 'running' }),
      }),
    ),
  );

  const codes = await Promise.all(
    responses.map(async (response) => {
      const body = (await response.json()) as { message?: string };
      return { status: response.status, message: body.message };
    }),
  );

  codes.forEach((result, index) => {
    console.log(
      `  request ${index + 1}: ${result.status}${
        result.message ? ` - ${JSON.stringify(result.message)}` : ''
      }`,
    );
  });

  const winners = codes.filter((result) => result.status === 200).length;
  const conflicts = codes.filter((result) => result.status === 409).length;

  const finalResponse = await fetch(`${baseUrl}/jobs`);
  const jobs = (await finalResponse.json()) as { id: string; status: string }[];
  const finalStatus = jobs.find((row) => row.id === job.id)?.status;

  console.log(`\nwinners (200): ${winners}`);
  console.log(`conflicts (409): ${conflicts}`);
  console.log(`final status in the database: ${finalStatus}`);

  const passed =
    winners === 1 && conflicts === attempts - 1 && finalStatus === 'running';

  console.log(passed ? '\nPASS' : '\nFAIL');
  process.exit(passed ? 0 : 1);
}

void main();
