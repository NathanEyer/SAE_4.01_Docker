FROM php:8.2-apache

# Active le mod_rewrite
RUN a2enmod rewrite

# Copie des fichiers sources
COPY backend/ /var/www/html/
COPY frontend/ /var/www/html/
COPY sentences/ /var/www/html/sentences/

# Crée le dossier recordings et donne les droits
RUN mkdir -p /var/www/html/recordings \
    && chown -R www-data:www-data /var/www/html/recordings \
    && chown -R www-data:www-data /var/www/html/ \
    && chmod -R 755 /var/www/html/

RUN sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf && \
sed -i 's/:80>/:8080>/' /etc/apache2/sites-enabled/000-default.conf
EXPOSE 8080

# Définit le user Apache pour éviter les conflits de droits
USER www-data
