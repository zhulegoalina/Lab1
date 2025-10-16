#ifndef IMAGEANALYZER_H
#define IMAGEANALYZER_H

#include <QObject>
#include <QString>

struct ImageMetadata {
    QString filename;
    QString filepath;
    QString size;
    QString resolution;
    QString colorDepth;
    QString compression;
    QString format;
    QString error;
    QString fileSize;
    QString colorsInPalette;
};

class ImageAnalyzer : public QObject
{
    Q_OBJECT

public:
    explicit ImageAnalyzer(QObject *parent = nullptr);
    void analyzeFolder(const QString &folderPath, bool *stopFlag);

signals:
    void progressUpdated(int value, const QString &status);
    void resultReady(const QString &filename, const ImageMetadata &metadata);
    void finished();

private:
    ImageMetadata analyzeImage(const QString &filePath);
    QString formatFileSize(qint64 bytes);
};

#endif // IMAGEANALYZER_H
