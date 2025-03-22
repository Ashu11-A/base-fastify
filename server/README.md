## Database Installation

```sh
# MariaDB repo setup script (Ubuntu 20.04)
curl -LsS https://r.mariadb.com/downloads/mariadb_repo_setup | sudo bash

# Update repositories list
sudo apt update

sudo apt -y install mariadb-server
```

## Database Configuration

```sh
mysql -u root -p

# Remember to change 'password' below to be a unique password
CREATE USER 'fragment'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'fragment'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
exit
```
