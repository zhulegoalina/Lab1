#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QFutureWatcher>
#include <QMap>
#include <QElapsedTimer>
#include "imageanalyzer.h"

QT_BEGIN_NAMESPACE
namespace Ui {
class MainWindow;
}
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

private slots:
    void on_browseButton_clicked();
    void on_analyzeButton_clicked();
    void on_stopButton_clicked();
    void on_searchText_textChanged(const QString &text);
    void analysisFinished();
    void progressUpdated(int value, const QString &status);
    void resultReady(const QString &filename, const ImageMetadata &metadata);
    void on_tableWidget_cellDoubleClicked(int row, int column);

private:
    Ui::MainWindow *ui;
    QFutureWatcher<void> m_futureWatcher;
    QMap<QString, ImageMetadata> m_results;
    QMap<QString, ImageMetadata> m_filteredResults;
    bool m_stopRequested = false;
    QElapsedTimer m_timer;

    void updateTable();
    void showDetails(int row);
    void applyFilter(const QString &filter);
    void loadStyles();
    void updateStatistics();
    QString formatFileSize(qint64 bytes);
    QString getAdditionalInfo(const QString &format, const QString &filePath);
};

#endif // MAINWINDOW_H
