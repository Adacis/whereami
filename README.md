[![Deploy app](https://github.com/Adacis/whereami/actions/workflows/release.yml/badge.svg)](https://github.com/Adacis/whereami/actions/workflows/release.yml)

# Where Am I ?

<div align="center">
  <a href="
     https://github.com/LoueTaVoiture/louetavoiture-front/">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Nextcloud_Logo.svg/2560px-Nextcloud_Logo.svg.png" alt="Logo" width="130">
    <img src="https://github.com/Adacis/whereami/blob/main/img/app-dark.svg" alt="Logo dark" width="120" height="130">
    </a>

<h3 align="center">Where Am I ? (WAI)</h3>

  <p align="center">
    Where am I is a management application allowing users to record and see who and what everyone is working on in a calendar and table. The application is hosted on Nextcloud.
    <br />
    <br />
  </p>
</div>


## Tech Stack

**Client:** JS

**Server:** PHP Symphony

**Database:** MySQL

## Installation

### Prerequisites

The Git command must be installed on the machine, or if you're on Windows or MacOS, you can use the Github Desktop application: https://desktop.github.com/

Once git is installed on your machine, clone the WhereAmI project (https://github.com/Adacis/whereami.git) to a directory on your machine.

Install Docker (Windows, MacOS or Linux): https://www.docker.com/products/docker-desktop
or from the command line (e.g. Ubuntu):
https://docs.docker.com/engine/install/ubuntu/

After installing Docker, create the “nextcloud” network:
```sh
 docker network create nextcloud
 ```



### Installing the Nextcloud database

This part of the installation will enable us to install a MySQL 8.3.0 database, which will be the database for our Nextcloud application.

**Step 1**:
Go to the directory where the project was cloned in the prerequisites and then to the “whereami-docker” folder:

```sh
cd whereami-docker/
```

**Step 2**:
Run the docker command to create the MySQL database container:
```sh
docker compose up -d
```

**Step 3**:
Check that the container has launched with the command :
```sh
docker ps
```

A container named “nextcloud-db” should be present in the list. If not, you can retrieve the container's logs with the command
docker logs nextcloud-db

**Step 4**:
Check that the database is accessible with a tool like Dbeaver (https://dbeaver.io/).
The identifiers are as follows:
```
Server Host: localhost
Port: 3306
Username: nextcloud
Password: nextcloud
```

### Installing the Nextcloud application

This part requires you to have installed the database beforehand.

**Step 1**:
Create a “nextcloud_data” folder on your machine:
```sh
mkdir /Users/miage/Documents/nextcloud_data
```

**Step 2**:
Launch the nextcloud container, which loads the nextcloud:28.0.5 image.
(Remember to change the data folder /Users/miage/Documents/nextcloud_data to the one you created in step 1)
```sh
docker run -d --name nextcloud -p 8001:80 -v /Users/miage/Documents/nextcloud_data:/var/www/html --network nextcloud nextcloud:28.0.5
```

Note that the container will be on port 8001 of the machine, so it's possible to modify it if necessary.

**Step 3**:
Check that the container has launched with the command :
```sh
docker ps
```

A container named “nextcloud” should be present in the list. If not, you can retrieve the container's logs with the command :
```sh
docker logs nextcloud
```


**Step 4**:
Go to Nextcloud at http://localhost:8001
Enter the credentials for the Nextcloud administrator account you want, e.g. :
```
Username : adacis
Password : admin
```

In the “Configure database” section, select the “MySQL/MariaDB” box and enter the following information:
```
Database user: nextcloud
Database password: nextcloud
Database name: nextcloud-db
Database host: nextcloud-db:3306
```



Then click on Install.
You now have an instance of Nextcloud 28.0.5.

### Installing the WhereAmI application

**Step 1** :
Take the project already cloned in a directory, and copy it into the nextcloud_data/apps/ folder created during Nextcloud installation with the command
```sh
cp -r [Directory containing cloned project]/whereami [Path to nextcloud_data folder]/nextcloud_data/apps/
```

**Step 2** :
- Log on to Nextcloud with an administrator account
- Click on your profile photo in the top right-hand corner of the screen
- Select “Applications
- Search for the “Where am I?” application and click on Activate


You now have the Where Am I application on Nextcloud. To use this application, please refer to the user manual.


## Deployment (only in dev mode)

### First time deployment
To deploy this project run the following commands in the order :
- Start the Docker Bash Terminal for Nextcloud
```bash
docker exec -it nextcloud bash
```
- Navigate to the correct folder
```bash
cd apps/whereami/ 
```
- Install and update NPM if you don't have it
```bash
apt-get update && apt-get install -y npm
```
- Initialise the project
```bash
make npm-init
```
- Build the project
```bash
make build-js
```

### Build
- Start the Docker Bash Terminal
```bash
docker exec -it nextcloud bash
```
- Place yourself in the correct folder
```bash
cd apps/whereami/ 
```
- Build the project
```bash
make build-js
```
## Features
- **Event Assignment using the Calendar feature**: Users can register themselves, record their whereabouts and time slots for specific contracts as well as their work status, which are then converted into full or half work days.
- **Employees Tab**: A summary table of all users, their locations, and their status for the selected date range.
- **Location Tab**: A summary table showing the number of users by location for the selected date range.
- **Last Seen Tab**: A summary table of all the instances where users have crossed paths with other users within the selected date range.
- **Contract Tab**: A summary table listing all users with their contracts and the total hours worked, rounded to the nearest half day, for the selected date range.
- **Summary Tab**: A summary table showing the locations and the time spent at each location by the user for the selected month.
- **Hover Summary Functionality**: Provide brief information when hovering over specific dates.

## Authors
- [@Benjamin Aimard](https://github.com/baimard)
