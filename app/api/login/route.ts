export async function POST(req: Request) {

  const { email, password } = await req.json();

  const response = await fetch("https://api.propertysync.com/v1/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  return response
}
