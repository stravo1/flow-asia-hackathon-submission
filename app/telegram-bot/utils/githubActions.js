const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

// Configuration
const repoUrl = process.env.GITHUB_REPO; // Replace with your repo URL
const branch = process.env.GITHUB_BRANCH; // Replace with the branch name
const repo = process.env.GITHUB_REPO_NAME;
const localDir = path.resolve(process.cwd(), repo);

// GitHub authentication
const username = 'stravo1'; // Replace with your GitHub username
const token = process.env.GITHUB_API_TOKEN; // Replace with your PAT

async function cloneRepo() {
    const git = simpleGit(
        localDir,
        {
            baseDir: localDir,
            binary: 'git',
            maxConcurrentProcesses: 6,
        }
    );
    if (!fs.existsSync(`${localDir}/.git`)) {
        console.log('Cloning repository...');
        console.log(`https://${token}@github.com/${username}/${repo}.git`);
        await git.clone(`https://${token}@github.com/${username}/${repo}.git`, localDir);
    }
    console.log('Repo cloned');
}

async function pushFiles(tokenId) {
    const git = simpleGit(
        localDir,
        {
            baseDir: localDir,
            binary: 'git',
            maxConcurrentProcesses: 6,
        }
    );
    try {

        await git.addConfig('user.name', 'flow-asia-hackathon-nft-bot', false, 'local');
        await git.addConfig('user.email', 'stravo1@gmail.com', false, 'local');

        // Change to repo directory
        process.chdir(localDir);
        // Replace with your file data

        console.log('Adding changes...');
        await git.add('.'); // Add all files

        console.log('Committing changes...');
        await git.commit(`add: JSON and image for token ${tokenId}`);

        console.log('Pushing to repository...');
        await git.push('origin', branch);

        console.log('Files pushed successfully!');
    } catch (error) {
        console.error('Error pushing files:', error);
    }
}

module.exports = {
    pushFiles,
    cloneRepo,
    localDir,
}