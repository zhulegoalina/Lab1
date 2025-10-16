#include "mainwindow.h"
#include "ui_mainwindow.h"
#include <QFileDialog>
#include <QMessageBox>
#include <QHeaderView>
#include <QFile>
#include <QTextStream>
#include <QtConcurrent>
#include <QLabel>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    setWindowTitle("Image Metadata Analyzer");
    loadStyles();

    // Настройка таблицы
    QStringList headers = {
        "Имя файла",
        "Размер (пиксели)",
        "Разрешение (DPI)",
        "Глубина цвета",
        "Сжатие",
        "Формат"
    };
    ui->tableWidget->setColumnCount(headers.size());
    ui->tableWidget->setHorizontalHeaderLabels(headers);
    ui->tableWidget->horizontalHeader()->setSectionResizeMode(QHeaderView::Stretch);
    ui->tableWidget->setSortingEnabled(true);
    ui->tableWidget->setAlternatingRowColors(true);
    ui->tableWidget->setSelectionBehavior(QAbstractItemView::SelectRows);
    ui->tableWidget->setEditTriggers(QAbstractItemView::NoEditTriggers);

    ui->stopButton->setObjectName("stopButton");
    ui->statusLabel->setText("Готов к работе");

    // ДОБАВИТЬ ЭТУ СТРОКУ - соединение для завершения анализа
    connect(&m_futureWatcher, &QFutureWatcher<void>::finished,
            this, &MainWindow::analysisFinished);
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::loadStyles()
{
    QFile styleFile(":/styles.qss");
    if (styleFile.open(QFile::ReadOnly)) {
        QString style = QLatin1String(styleFile.readAll());
        this->setStyleSheet(style);
    }
}

void MainWindow::on_browseButton_clicked()
{
    QString folder = QFileDialog::getExistingDirectory(this, "Выберите папку с изображениями");
    if (!folder.isEmpty()) {
        ui->folderLineEdit->setText(folder);
        ui->analyzeButton->setEnabled(true);
        ui->searchText->clear();
        ui->statusLabel->setText("Папка выбрана: " + folder);
    }
}

void MainWindow::on_analyzeButton_clicked()
{
    QString folder = ui->folderLineEdit->text();
    if (folder.isEmpty()) {
        QMessageBox::warning(this, "Предупреждение", "Пожалуйста, выберите папку с изображениями.");
        return;
    }

    if (!QDir(folder).exists()) {
        QMessageBox::critical(this, "Ошибка", "Выбранная папка не существует!");
        return;
    }

    m_stopRequested = false;
    m_results.clear();
    m_filteredResults.clear();
    ui->tableWidget->setRowCount(0);
    ui->analyzeButton->setEnabled(false);
    ui->stopButton->setEnabled(true);
    ui->progressBar->setVisible(true);
    ui->progressBar->setValue(0);
    ui->searchText->clear();

    m_timer.start();
    ui->statusLabel->setText("Анализ изображений запущен...");

    ImageAnalyzer *analyzer = new ImageAnalyzer(this);
    connect(analyzer, &ImageAnalyzer::progressUpdated, this, &MainWindow::progressUpdated);
    connect(analyzer, &ImageAnalyzer::resultReady, this, &MainWindow::resultReady);
    connect(analyzer, &ImageAnalyzer::finished, analyzer, &ImageAnalyzer::deleteLater);

    QFuture<void> future = QtConcurrent::run([this, analyzer, folder]() {
        analyzer->analyzeFolder(folder, &m_stopRequested);
    });

    m_futureWatcher.setFuture(future);
}

void MainWindow::on_stopButton_clicked()
{
    m_stopRequested = true;
    ui->stopButton->setEnabled(false);
    ui->statusLabel->setText("Остановка анализа...");
}

void MainWindow::on_searchText_textChanged(const QString &text)
{
    applyFilter(text);
}

void MainWindow::progressUpdated(int value, const QString &status)
{
    ui->progressBar->setValue(value);
    ui->statusLabel->setText(status);
}


void MainWindow::on_tableWidget_cellDoubleClicked(int row, int column)
{
    Q_UNUSED(column)
    showDetails(row);
}

void MainWindow::updateTable()
{
    ui->tableWidget->setSortingEnabled(false);
    ui->tableWidget->setRowCount(m_filteredResults.size());

    int row = 0;
    for (auto it = m_filteredResults.constBegin(); it != m_filteredResults.constEnd(); ++it) {
        const ImageMetadata &metadata = it.value();

        QTableWidgetItem *fileItem = new QTableWidgetItem(metadata.filename);
        QTableWidgetItem *sizeItem = new QTableWidgetItem(metadata.size);
        QTableWidgetItem *resolutionItem = new QTableWidgetItem(metadata.resolution);
        QTableWidgetItem *colorItem = new QTableWidgetItem(metadata.colorDepth);
        QTableWidgetItem *compressionItem = new QTableWidgetItem(metadata.compression);
        QTableWidgetItem *formatItem = new QTableWidgetItem(metadata.format);

        for (QTableWidgetItem* item : {fileItem, sizeItem, resolutionItem, colorItem, compressionItem, formatItem}) {
            item->setForeground(Qt::black);
            if (!metadata.error.isEmpty()) {
                item->setBackground(QColor(255, 200, 200));
                item->setToolTip(metadata.error);
            }
        }

        ui->tableWidget->setItem(row, 0, fileItem);
        ui->tableWidget->setItem(row, 1, sizeItem);
        ui->tableWidget->setItem(row, 2, resolutionItem);
        ui->tableWidget->setItem(row, 3, colorItem);
        ui->tableWidget->setItem(row, 4, compressionItem);
        ui->tableWidget->setItem(row, 5, formatItem);

        row++;
    }

    ui->tableWidget->setSortingEnabled(true);
}

void MainWindow::showDetails(int row)
{
    if (row < 0 || row >= ui->tableWidget->rowCount()) return;

    QString filename = ui->tableWidget->item(row, 0)->text();
    if (!m_filteredResults.contains(filename)) return;

    const ImageMetadata &metadata = m_filteredResults[filename];

    QString details = "МЕТАДАННЫЕ ИЗОБРАЖЕНИЯ\n\n";

    details += "ОСНОВНАЯ ИНФОРМАЦИЯ:\n";
    details += "Файл: " + metadata.filename + "\n";
    details += "Размер: " + metadata.size + " пикселей\n";
    details += "Разрешение: " + metadata.resolution + "\n";
    details += "Глубина цвета: " + metadata.colorDepth + "\n";
    details += "Сжатие: " + metadata.compression + "\n";
    details += "Формат: " + metadata.format + "\n\n";

    QString formatInfo = getAdditionalInfo(metadata.format, metadata.filepath);
    if (!formatInfo.isEmpty()) {
        details += "ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ О ФОРМАТЕ:\n";
        details += formatInfo + "\n\n";
    }

    if (!metadata.error.isEmpty()) {
        details += "ОШИБКА:\n";
        details += metadata.error + "\n";
    }

    ui->detailsTextEdit->setPlainText(details);
}

void MainWindow::applyFilter(const QString &filter)
{
    m_filteredResults.clear();

    if (filter.isEmpty()) {
        m_filteredResults = m_results;
    } else {
        for (auto it = m_results.constBegin(); it != m_results.constEnd(); ++it) {
            if (it.key().contains(filter, Qt::CaseInsensitive) ||
                it.value().format.contains(filter, Qt::CaseInsensitive)) {
                m_filteredResults[it.key()] = it.value();
            }
        }
    }

    updateTable();
    ui->statusLabel->setText(QString("Найдено: %1 файлов").arg(m_filteredResults.size()));
}

void MainWindow::updateStatistics()
{
    QString statsText;

    if (m_results.isEmpty()) {
        statsText = "Статистика будет отображена после анализа";
    } else {
        statsText = "📊 ДЕТАЛЬНАЯ СТАТИСТИКА АНАЛИЗА\n";
        statsText += "═══════════════════════════════════════════\n\n";

        // Основная статистика
        QMap<QString, int> formatStats;
        QMap<QString, qint64> formatSizes;
        qint64 totalSize = 0;
        QVector<QString> largestFiles;
        QVector<qint64> largestSizes;

        for (const ImageMetadata &metadata : m_results) {
            formatStats[metadata.format]++;
            QFileInfo fileInfo(metadata.filepath);
            qint64 fileSize = fileInfo.size();
            totalSize += fileSize;
            formatSizes[metadata.format] += fileSize;

            // Собираем топ-5 самых больших файлов
            largestFiles.append(metadata.filename);
            largestSizes.append(fileSize);
        }

        // Сортируем по размеру (самые большие первые)
        for (int i = 0; i < largestSizes.size() - 1; ++i) {
            for (int j = i + 1; j < largestSizes.size(); ++j) {
                if (largestSizes[j] > largestSizes[i]) {
                    std::swap(largestSizes[i], largestSizes[j]);
                    std::swap(largestFiles[i], largestFiles[j]);
                }
            }
        }

        statsText += QString("📁 ОБЩАЯ ИНФОРМАЦИЯ:\n");
        statsText += QString("• Всего файлов: %1\n").arg(m_results.size());
        statsText += QString("• Общий размер: %1\n").arg(formatFileSize(totalSize));
        statsText += QString("• Средний размер файла: %1\n\n").arg(formatFileSize(totalSize / m_results.size()));

        // Статистика по форматам с размерами
        statsText += QString("📈 СТАТИСТИКА ПО ФОРМАТАМ:\n");
        for (auto it = formatStats.constBegin(); it != formatStats.constEnd(); ++it) {
            double percentage = (it.value() * 100.0) / m_results.size();
            double sizePercentage = (formatSizes[it.key()] * 100.0) / totalSize;
            statsText += QString("• %1: %2 файлов (%3%) - %4 (%5%)\n")
                             .arg(it.key())
                             .arg(it.value())
                             .arg(percentage, 0, 'f', 1)
                             .arg(formatFileSize(formatSizes[it.key()]))
                             .arg(sizePercentage, 0, 'f', 1);
        }

        // Статистика по размерам изображений
        int smallImages = 0, mediumImages = 0, largeImages = 0, hugeImages = 0;
        int maxWidth = 0, maxHeight = 0;
        QString largestImage;

        for (const ImageMetadata &metadata : m_results) {
            QStringList dimensions = metadata.size.split(" × ");
            if (dimensions.size() == 2) {
                int width = dimensions[0].toInt();
                int height = dimensions[1].toInt();
                int totalPixels = width * height;

                if (totalPixels < 100000) smallImages++;
                else if (totalPixels < 1000000) mediumImages++;
                else if (totalPixels < 10000000) largeImages++;
                else hugeImages++;

                // Самое большое изображение
                if (width * height > maxWidth * maxHeight) {
                    maxWidth = width;
                    maxHeight = height;
                    largestImage = metadata.filename;
                }
            }
        }

        statsText += QString("\n🖼️  СТАТИСТИКА ПО РАЗМЕРАМ:\n");
        statsText += QString("• Малые (< 100K пикселей): %1 файлов\n").arg(smallImages);
        statsText += QString("• Средние (100K-1M пикселей): %1 файлов\n").arg(mediumImages);
        statsText += QString("• Большие (1M-10M пикселей): %1 файлов\n").arg(largeImages);
        statsText += QString("• Огромные (> 10M пикселей): %1 файлов\n").arg(hugeImages);
        statsText += QString("• Самое большое: %1 (%2 × %3 пикселей)\n").arg(largestImage).arg(maxWidth).arg(maxHeight);

        // Производительность
        qint64 elapsed = m_timer.elapsed();
        if (elapsed > 0) {
            double speed = m_results.size() / (elapsed / 1000.0);
            statsText += QString("\n⚡ ПРОИЗВОДИТЕЛЬНОСТЬ:\n");
            statsText += QString("• Время анализа: %1 сек.\n").arg(elapsed / 1000.0, 0, 'f', 2);
            statsText += QString("• Скорость: %1 файлов/сек.\n").arg(speed, 0, 'f', 2);
            statsText += QString("• Среднее время на файл: %1 мс\n").arg((double)elapsed / m_results.size(), 0, 'f', 1);
        }
    }

    // Выводим в QLabel на вкладке статистики
    QWidget* statsTab = ui->tabWidget->widget(1);
    if (statsTab) {
        QLabel* statsLabel = statsTab->findChild<QLabel*>();
        if (statsLabel) {
            statsLabel->setText(statsText);
            statsLabel->setWordWrap(true);
        } else {
            // Резервный вывод
            ui->detailsTextEdit->setPlainText(statsText);
        }
    }
}


void MainWindow::resultReady(const QString &filename, const ImageMetadata &metadata)
{
    m_results[filename] = metadata;

    if (ui->searchText->text().isEmpty() ||
        filename.contains(ui->searchText->text(), Qt::CaseInsensitive)) {
        m_filteredResults[filename] = metadata;
        updateTable();
    }

    ui->statusLabel->setText(QString("Обработано: %1 файлов").arg(m_results.size()));
    updateStatistics();
}

void MainWindow::analysisFinished()
{
    ui->analyzeButton->setEnabled(true);
    ui->stopButton->setEnabled(false);

    qint64 elapsed = m_timer.elapsed();
    QString status = QString("Анализ завершен. Файлов: %1. Время: %2 сек.")
                         .arg(m_results.size())
                         .arg(elapsed / 1000.0, 0, 'f', 1);

    ui->statusLabel->setText(status);
    updateStatistics();
}

QString MainWindow::formatFileSize(qint64 bytes)
{
    if (bytes < 1024) return QString("%1 байт").arg(bytes);
    else if (bytes < 1024 * 1024) return QString("%1 КБ").arg(bytes / 1024.0, 0, 'f', 1);
    else if (bytes < 1024 * 1024 * 1024) return QString("%1 МБ").arg(bytes / (1024.0 * 1024.0), 0, 'f', 1);
    else return QString("%1 ГБ").arg(bytes / (1024.0 * 1024.0 * 1024.0), 0, 'f', 1);
}
QString MainWindow::getAdditionalInfo(const QString &format, const QString &filePath)
{
    QString additional;

    if (format == "JPG" || format == "JPEG") {
        additional = "Цветовое пространство: YCbCr";
    } else if (format == "PNG") {
        QImage image(filePath);
        if (!image.isNull()) {
            additional = QString("Каналов: %1").arg(image.isGrayscale() ? "1" : "3-4");
        }
    } else if (format == "GIF") {
        additional = "Палитровое изображение (256 цветов)";
    } else if (format == "BMP") {
        // Дополнительная информация для BMP
        QFile file(filePath);
        if (file.open(QIODevice::ReadOnly)) {
            QDataStream stream(&file);
            stream.setByteOrder(QDataStream::LittleEndian);

            // Читаем сигнатуру "BM"
            char signature[2];
            stream.readRawData(signature, 2);

            if (signature[0] == 'B' && signature[1] == 'M') {
                // Пропускаем размер файла и зарезервированные поля
                stream.skipRawData(8);

                // Читаем смещение до данных пикселей
                quint32 dataOffset;
                stream >> dataOffset;

                // Читаем размер заголовка
                quint32 headerSize;
                stream >> headerSize;

                QString bmpType;
                if (headerSize == 12) {
                    bmpType = "BITMAPCOREHEADER (OS/2 1.x)";
                } else if (headerSize == 40) {
                    bmpType = "BITMAPINFOHEADER (Windows 3.x+)";
                } else if (headerSize == 108) {
                    bmpType = "BITMAPV4HEADER";
                } else if (headerSize == 124) {
                    bmpType = "BITMAPV5HEADER";
                } else {
                    bmpType = QString("Неизвестный заголовок (%1 байт)").arg(headerSize);
                }

                additional = QString("Тип BMP: %1 | Смещение данных: %2 байт")
                                 .arg(bmpType).arg(dataOffset);
            } else {
                additional = "Неверная сигнатура BMP";
            }
            file.close();
        } else {
            additional = "Ошибка чтения файла";
        }
    }

    return additional;
}
