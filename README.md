# Vibecode CLI

> Quickly set up React (Vite) or Next.js projects with automatic GitHub repo creation and Vercel deployment.

## Features

- Supports React (Vite) & Next.js
- Creates a GitHub repo automatically
- Deploys to Vercel instantly
- Pre-configured setup with a stylish UI

## Installation

Use without installing:

```bash
npx vibecode start my-project
```

once you install, you'll see this prompt:
Github Token is missing. Please provide your Github Personal Access Token

go to github developer settings -> Generate a new token with repo and workflow permissions, and paste the token

-- this step is needed so the CLI can create a GitHub repo for you automatically.

Or install globally:

npm install -g vibecode

Then run:

vibecode start my-project

## How to Use

Run the following command:

```bash
vibecode start my-app
```

Then choose a framework:

- ✔ React (Vite)
- ✔ Next.js

### What Vibecode Does:

- Creates a GitHub repository
- Clones it locally
- Sets up the project
- Installs dependencies
- Pushes to GitHub
- Deploys to Vercel

At the end, you'll see: Your project is live at → https://your-live-vercel-link.vercel.app

💻 Run the Project Locally

For React (Vite):

```bash
npm run dev
```

➡ Opens at http://localhost:5173

For Next.js:

```bash
npm run dev
```

➡ Opens at http://localhost:3000

🔧 Troubleshooting

### GitHub Token Missing?

Set it in .env:

GITHUB_TOKEN=your_personal_github_token

(Generate one at GitHub Developer Settings)

### Vercel Not Logged In?

Run:

```bash
vercel login
```

🛠️ Development & Contribution

1. Clone the repository:

```bash
git clone https://github.com/kju4q/vibecoding-cli
cd vibecode
```

2. Install dependencies:

```bash
npm install
```

3. Run locally:

```bash
node index.js start test-project
```

4. Submit a PR!

Feel free to contribute, improve, or add features!

📜 License

MIT License – Free to use & modify!

Now go build something awesome with Vibecode!✨
