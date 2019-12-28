module.exports = (sequelize, DataTypes) => {
    return sequelize.define('good', {
        name: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        img: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
    }, {
        timestamps: true,
        paranoid: true,
    });
};
