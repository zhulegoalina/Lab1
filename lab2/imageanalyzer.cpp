#include "imageanalyzer.h"
#include <QDir>
#include <QFileInfo>
#include <QImage>
#include <QDebug>
#include <QThread>

ImageAnalyzer::ImageAnalyzer(QObject *parent) : QObject(parent) {}

void ImageAnalyzer::analyzeFolder(const QString &folderPath, bool *stopFlag)
{
    QStringList imageFilters = {"*.jpg", "*.jpeg", "*.gif", "*.tif", "*.tiff",
                                "*.bmp", "*.png", "*.pcx"};

    QDir directory(folderPath);
    QStringList imageFiles = directory.entryList(imageFilters, QDir::Files | QDir::NoDotAndDotDot);

    int totalFiles = imageFiles.size();
    if (totalFiles == 0) {
        emit finished();
        return;
    }

    int processed = 0;

    for (const QString &filename : imageFiles) {
        if (*stopFlag) break;

        QString filePath = directory.filePath(filename);
        ImageMetadata metadata = analyzeImage(filePath);
        emit resultReady(filename, metadata);

        processed++;
        int progress = (processed * 100) / totalFiles;
        QString status = QString("Обработка: %1/%2 файлов").arg(processed).arg(totalFiles);
        emit progressUpdated(progress, status);

        QThread::msleep(1);
    }

    emit finished();
}

ImageMetadata ImageAnalyzer::analyzeImage(const QString &filePath)
{
    ImageMetadata metadata;
    metadata.filepath = filePath;
    metadata.filename = QFileInfo(filePath).fileName();

    QImage image(filePath);

    if (image.isNull()) {
        metadata.error = "Не удается загрузить изображение";
        return metadata;
    }

    try {
        // 1. Размер изображения в пикселях
        metadata.size = QString("%1 × %2").arg(image.width()).arg(image.height());

        // 2. Разрешение DPI
        int dpmX = image.dotsPerMeterX();
        int dpmY = image.dotsPerMeterY();
        if (dpmX > 0 && dpmY > 0) {
            int dpiX = qRound(dpmX * 0.0254);
            int dpiY = qRound(dpmY * 0.0254);
            metadata.resolution = QString("%1 × %2").arg(dpiX).arg(dpiY);
        } else {
            metadata.resolution = "Не указано";
        }

        // 3. Глубина цвета
        switch (image.depth()) {
        case 1: metadata.colorDepth = "1 бит"; break;
        case 8: metadata.colorDepth = "8 бит"; break;
        case 24: metadata.colorDepth = "24 бита"; break;
        case 32: metadata.colorDepth = "32 бита"; break;
        default: metadata.colorDepth = QString("%1 бит").arg(image.depth());
        }

        // 4. Формат и сжатие
        QString ext = QFileInfo(filePath).suffix().toUpper();
        metadata.format = ext;

        if (ext == "JPG" || ext == "JPEG") {
            metadata.compression = "JPEG";
        } else if (ext == "PNG") {
            metadata.compression = "Deflate";
        } else if (ext == "GIF") {
            metadata.compression = "LZW";
        } else if (ext == "TIFF" || ext == "TIF") {
            metadata.compression = "Зависит от файла";
        } else if (ext == "BMP") {
            metadata.compression = "Без сжатия";
        } else if (ext == "PCX") {
            metadata.compression = "RLE";
        } else {
            metadata.compression = "Неизвестно";
        }

        QFileInfo fileInfo(filePath);
        metadata.fileSize = formatFileSize(fileInfo.size());

        if (ext == "BMP" && image.colorCount() > 0) {
            metadata.colorsInPalette = QString::number(image.colorCount());
        }

    } catch (...) {
        metadata.error = "Ошибка при анализе изображения";
    }

    return metadata;
}

QString ImageAnalyzer::formatFileSize(qint64 bytes)
{
    if (bytes < 1024) return QString("%1 байт").arg(bytes);
    else if (bytes < 1024 * 1024) return QString("%1 КБ").arg(bytes / 1024.0, 0, 'f', 1);
    else return QString("%1 МБ").arg(bytes / (1024.0 * 1024.0), 0, 'f', 1);
}
