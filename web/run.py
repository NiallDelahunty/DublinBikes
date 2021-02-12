from dublinbikes import app

#module's sole purpose is to enable running app from command line.
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)