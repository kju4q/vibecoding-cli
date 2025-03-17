#!/usr/bin/env node
import "dotenv/config";
import { Octokit } from "@octokit/rest";
import { program } from "commander";
import shell from "shelljs";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import os from "os";
import chalk from "chalk";
import readline from "readline";

// Prompt for GitHub Token if missing
async function checkGitHubToken() {
  if (!process.env.GITHUB_TOKEN) {
    console.log(chalk.red("❌ GitHub Token is missing."));

    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(
        chalk.blue("🔑 Enter your GitHub Personal Access Token: "),
        (token) => {
          rl.close();
          if (!token.trim()) {
            console.error(chalk.red("❌ No token provided. Exiting..."));
            process.exit(1);
          }
          process.env.GITHUB_TOKEN = token.trim();
          console.log(chalk.green("✅ GitHub Token set for this session."));
          console.log(
            chalk.yellow(
              "💡 Tip: Save this token in a `.env` file to avoid entering it every time."
            )
          );
          resolve(token.trim());
        }
      );
    });
  }
}

console.log(
  "🔍 GitHub Token:",
  process.env.GITHUB_TOKEN ? "Token is set ✅" : "Token is missing ❌"
);
// Ensure GitHub Token is set before initializing Octokit
async function initializeOctokit() {
  await checkGitHubToken();
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

// Ensure correct Node.js version
const requiredNodeVersion = "18.18.0";
const currentNodeVersion = process.version.replace("v", "");

if (currentNodeVersion < requiredNodeVersion) {
  console.error(`❌ You need Node.js ${requiredNodeVersion} or higher.`);
  console.error(`⚡ Upgrade at: https://nodejs.org/`);
  process.exit(1);
}

// Ask the user to choose a framework
async function askFramework() {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "framework",
      message: "Choose a framework for your Vibe Coding project:",
      choices: ["React", "Next.js"],
    },
  ]);
  return answers.framework;
}

//  Get GitHub username dynamically
async function getGitHubUsername(octokit) {
  try {
    const { data: user } = await octokit.users.getAuthenticated();
    return user.login;
  } catch (error) {
    console.error(
      chalk.red("❌ Error fetching GitHub username:"),
      error.message
    );
    process.exit(1);
  }
}

// Get Vercel Deployment URL
function getVercelLiveURL() {
  const output = shell.exec("vercel --prod", { silent: true }).stdout;
  const match = output.match(/https:\/\/[\w.-]+\.vercel\.app/);
  return match ? match[0] : chalk.red("Vercel deployment URL not found.");
}

//  Display Vibe Animation After Project Setup
function displayVibeAnimation(framework) {
  console.log(chalk.magenta.bold("You're now Vibe Coding! 🎨"));

  let content = "";
  if (framework === "React") {
    content = `
  function App() {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #89CFF0, #FFB6C1)',
        color: '#333',
        fontFamily: "'Inter', sans-serif",
        textAlign: "center",
        fontSize: "20px",
      }}>
        <h1>You're now Vibe Coding 🎨</h1>
        <p>Build cool things, experiment, and let AI guide your creativity.</p>
      </div>
    );
  }
  
  export default App;
  `;
    fs.writeFileSync("src/App.tsx", content, "utf8");
  } else if (framework === "Next.js") {
    content = `
  export default function Page() {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #89CFF0, #FFB6C1)',
        color: '#333',
        fontFamily: "'Inter', sans-serif",
        textAlign: "center",
        fontSize: "20px",
      }}>
        <h1>You're now Vibe Coding 🎨</h1>
        <p>Build cool things, experiment, and let AI guide your creativity.</p>
      </div>
    );
  }
  `;
    fs.writeFileSync("src/app/page.tsx", content, "utf8");
  }
}

// CLI Command
program
  .command("start <projectName>")
  .description("Create a new GitHub repository and set up the project")
  .action(async (projectName) => {
    console.log(`🚀 Starting Vibe Coding project: ${projectName}`);

    const octokit = await initializeOctokit();
    await createGitHubRepo(projectName, octokit);
  });

async function createGitHubRepo(projectName, octokit) {
  console.log(
    chalk.blue(
      `🚀 DEBUG: createGitHubRepo called with projectName: ${projectName}`
    )
  );

  try {
    const framework = await askFramework();
    console.log(chalk.green(`🎨 User selected framework: ${framework}`));

    console.log(chalk.blue("📦 Creating a new GitHub repository..."));
    const response = await octokit.repos.createForAuthenticatedUser({
      name: projectName,
      private: false,
    });

    console.log(`✅ Repo created: ${response.data.html_url}`);

    console.log("🔄 Cloning repository locally...");
    shell.exec(`git clone ${response.data.clone_url}`);

    const repoPath = path.join(process.cwd(), projectName);
    const tempPath = path.join(os.tmpdir(), projectName);

    shell.rm("-rf", tempPath);
    shell.mkdir("-p", tempPath);

    console.log(`📂 Using temporary directory for project setup: ${tempPath}`);
    setupFramework(framework, tempPath);

    console.log("🚚 Moving project files into the cloned GitHub repo...");
    shell.mv(`${tempPath}/*`, repoPath);
    shell.cd(repoPath);

    const username = await getGitHubUsername(octokit);
    shell.exec("rm -rf .git");
    shell.exec("git init");
    fs.writeFileSync(".gitignore", "node_modules/\n.vercel\n", { flag: "w" });

    shell.exec("git add . -f -- ':!node_modules/'", { silent: true });
    shell.exec('git commit -m "Initial commit with selected framework"', {
      silent: true,
    });
    shell.exec(`git branch -M main`);
    shell.exec(
      `git remote add origin https://github.com/${username}/${projectName}.git`
    );
    shell.exec("git push -u origin main");

    console.log(chalk.green("🚀 Project is set up and pushed to GitHub!"));

    console.log(chalk.blue("🌎 Deploying project to Vercel..."));
    checkVercelLogin();
    shell.exec("vercel --prod --yes");

    const vercelURL = getVercelLiveURL();
    console.log(
      chalk.bgBlue.white.bold(`🎉 Your project is live at → ${vercelURL}`)
    );

    console.log(chalk.blue("📦 Installing dependencies..."));
    shell.exec("npm install", { silent: false });

    console.log(chalk.green("💻 Starting your project locally..."));
    shell.exec("npm run dev", { async: true });

    console.log(
      chalk.cyan(
        `🚀 Done! Your project is running at:\n   - ${
          framework === "React"
            ? "React (Vite): http://localhost:5173"
            : "Next.js: http://localhost:3000"
        }`
      )
    );
  } catch (error) {
    console.error(
      chalk.red("❌ Error creating GitHub repository:"),
      error.message
    );
    process.exit(1);
  }
}

// Setup Framework
function setupFramework(framework, projectPath) {
  console.log(
    chalk.blue(`🎨 Setting up ${framework} project in ${projectPath}...`)
  );
  shell.cd(projectPath);

  if (framework === "React") {
    shell.exec("npm create vite@latest . -- --template react-ts --force", {
      silent: false,
    });
    displayVibeAnimation(framework);
  } else if (framework === "Next.js") {
    shell.exec("npx create-next-app@latest . --ts --use-npm --yes --force", {
      silent: false,
    });
    displayVibeAnimation(framework);
  }
}

// Check Vercel Login
function checkVercelLogin() {
  console.log(chalk.blue("🔍 Checking for Vercel CLI..."));

  if (!shell.which("vercel")) {
    console.error(chalk.red("❌ Vercel CLI is not installed."));
    console.error("Run: npm install -g vercel");
    process.exit(1);
  }

  console.log(chalk.green("✅ Vercel CLI detected!"));

  const loginCheck = shell
    .exec("vercel whoami", { silent: true })
    .stdout.trim();
  if (!loginCheck) {
    console.log(chalk.yellow("🔑 Logging into Vercel with GitHub..."));
    shell.exec("vercel login --github", { silent: false });
  } else {
    console.log(chalk.green(`✅ Logged into Vercel as ${loginCheck}`));
  }
}

// Execute CLI
(async () => {
  await program.parseAsync(process.argv);
})();
