# Visualization 2 - Stippling of 2D Scalar Fields

This repository contains the project for the Visualization 2 (186.833) course at TU Wien during the Winter 2024 semester. The project implements [Linde-Buzo-Gray algorithm](https://en.wikipedia.org/wiki/Linde%E2%80%93Buzo%E2%80%93Gray_algorithm) for stippling of 2D Scalar fields, based on the research paper [Stippling of 2D Scalar Fields](https://ieeexplore.ieee.org/document/8667696) by Görtler et al.

## Team Members

- David Bauer
- Dominik Kanjuh

## Project Structure

The project is structured as follows:

- `proposals and presentations/`: Contains project proposals and presentation slides
  \*\*\*\*- `database/`: Contains the sql files to fil the database as well as the initialization script
- `backend/`: Contains the backend code, implemented in Node.js and Express.js
- `frontend/`: Contains the frontend code, implemented using TypeScript and WebGPU

## How to run the project

Each of the backend and frontend code has its own README file with instructions on how to run the code separately on your local machine.

Since the sql files to populate the database were too large for github we've stored them on onedrive. To download them you can just run the script /database/download-sql.sh

```bash
chmod +x database/download-sql.sh
./database/download-sql.sh
```

We've also made the docker compose so you can just run the whole project on your machine using:

```bash
docker-compose up --build
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
