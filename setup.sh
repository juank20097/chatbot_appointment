echo "---------------------------------------------------------------------------------"
echo "-------------------------Configuración de Zona Horaria---------------------------"
echo "---------------------------------------------------------------------------------"
sudo timedatectl set-timezone America/Guayaquil
echo "Zona horaria configurada a:"
timedatectl 
echo "---------------------------------------------------------------------------------"
echo "---------------------Actualización de repositorio--------------------------------"
echo "---------------------------------------------------------------------------------"
sudo apt update
echo "---------------------------------------------------------------------------------"
echo "-----------------------Permitir uso de paquetes mediante http--------------------"
echo "---------------------------------------------------------------------------------"
sudo apt install apt-transport-https ca-certificates curl software-properties-common
echo "---------------------------------------------------------------------------------"
echo "-----------------------Adicion de clave GPG para Docker--------------------------"
echo "---------------------------------------------------------------------------------"
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
echo "---------------------------------------------------------------------------------"
echo "-----------------------Agregar Repositorio docker a source.list------------------"
echo "---------------------------------------------------------------------------------"
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
echo "---------------------------------------------------------------------------------"
echo "-----------------------Actualizacion de Paquetes---------------------------------"
echo "---------------------------------------------------------------------------------"
sudo apt update
echo "---------------------------------------------------------------------------------"
echo "-----------------------Verificacion de Repositorio-------------------------------"
echo "---------------------------------------------------------------------------------"
apt-cache policy docker-ce
echo "---------------------------------------------------------------------------------"
echo "-----------------------Instalacion Docker----------------------------------------"
echo "---------------------------------------------------------------------------------"
sudo apt install docker-ce
echo "---------------------------------------------------------------------------------"
echo "-----------------------Comprobación de Ejecución---------------------------------"
echo "---------------------------------------------------------------------------------"
sudo systemctl status docker