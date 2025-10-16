QT += core gui widgets concurrent

CONFIG += c++17

TARGET = ImageAnalyzer
TEMPLATE = app

DEFINES += QT_DEPRECATED_WARNINGS

SOURCES += \
    main.cpp \
    mainwindow.cpp \
    imageanalyzer.cpp

HEADERS += \
    mainwindow.h \
    imageanalyzer.h

FORMS += \
    mainwindow.ui

RESOURCES += \
    resources.qrc

win32: LIBS += -luser32

CONFIG += release
QMAKE_CXXFLAGS_RELEASE -= -O
QMAKE_CXXFLAGS_RELEASE += -O2
