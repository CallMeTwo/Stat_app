import numpy as np
import pandas as pd
from scipy import stats
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.diagnostic import het_breuschpagan
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, roc_auc_score, confusion_matrix


def safe_float(value, default=0.0):
    """Convert value to float, handling NaN and Inf"""
    if value is None:
        return default
    try:
        f = float(value)
        if np.isnan(f) or np.isinf(f):
            return default
        return f
    except (ValueError, TypeError):
        return default


def prepare_regression_data(data, dependent_var, independent_vars):
    """Prepare data for regression analysis"""
    df = pd.DataFrame(data)

    # Get dependent variable
    y = pd.to_numeric(df[dependent_var], errors='coerce')

    # Prepare independent variables
    X_dict = {}
    for var in independent_vars:
        series = df[var]
        # Try to convert to numeric first
        numeric_series = pd.to_numeric(series, errors='coerce')

        # Count how many values successfully converted to numeric
        numeric_count = numeric_series.notna().sum()
        original_count = series.notna().sum()

        if numeric_count == original_count and original_count > 0:
            # It's numeric - use the numeric version
            X_dict[var] = numeric_series.astype('float64')
        else:
            # It's categorical - one-hot encode it
            dummies = pd.get_dummies(series, prefix=var, drop_first=True, dtype='float64')
            for col in dummies.columns:
                X_dict[col] = dummies[col].astype('float64')

    X = pd.DataFrame(X_dict)

    # Ensure all columns are numeric
    for col in X.columns:
        X[col] = pd.to_numeric(X[col], errors='coerce')

    # Remove rows with missing values
    valid_idx = y.notna() & X.notna().all(axis=1)
    y = y[valid_idx].reset_index(drop=True).astype('float64')
    X = X[valid_idx].reset_index(drop=True)

    if len(y) == 0:
        raise ValueError("No valid data after removing missing values")

    if len(y) < len(independent_vars) + 2:
        raise ValueError(f"Not enough samples ({len(y)}) for {len(independent_vars)} predictors")

    return y, X


def run_linear_regression(data, dependent_var, independent_vars):
    """Fit linear regression model"""
    try:
        y, X = prepare_regression_data(data, dependent_var, independent_vars)

        # Add constant
        X = sm.add_constant(X)

        # Fit model
        model = sm.OLS(y, X).fit()

        # Extract coefficients
        coefficients = []
        conf_int_df = model.conf_int()
        for i, var_name in enumerate(X.columns):
            coef = model.params.iloc[i]
            std_err = model.bse.iloc[i]
            t_stat = model.tvalues.iloc[i]
            p_val = model.pvalues.iloc[i]
            ci_row = conf_int_df.iloc[i]

            coefficients.append({
                'variable': var_name,
                'coefficient': safe_float(coef, 0),
                'std_error': safe_float(std_err, 0),
                't_statistic': safe_float(t_stat, 0),
                'p_value': safe_float(p_val, 0),
                'ci_lower': safe_float(ci_row.iloc[0], 0),
                'ci_upper': safe_float(ci_row.iloc[1], 0)
            })

        # Calculate VIF for multicollinearity
        vif_dict = {}
        X_no_const = X.drop('const', axis=1)
        if len(X_no_const.columns) > 0:
            for i, col in enumerate(X_no_const.columns):
                try:
                    vif = variance_inflation_factor(X_no_const.values, i)
                    vif_dict[col] = safe_float(vif, 1.0)
                except:
                    vif_dict[col] = 1.0

        # Breusch-Pagan test for homoscedasticity
        bp_stat, bp_pval, _, _ = het_breuschpagan(model.resid, X)
        homoscedasticity_passed = bool(bp_pval > 0.05)

        # Shapiro-Wilk test for normality of residuals
        if len(model.resid) > 2:
            _, shapiro_pval = stats.shapiro(model.resid)
        else:
            shapiro_pval = 0.5
        normality_passed = bool(shapiro_pval > 0.05)

        # Multicollinearity check (VIF > 5 indicates problem)
        multicollinearity_passed = bool(all(v < 5 for v in vif_dict.values())) if vif_dict else True

        return {
            'regression_type': 'linear',
            'dependent_variable': dependent_var,
            'independent_variables': independent_vars,
            'model_fit': {
                'r_squared': safe_float(model.rsquared, 0),
                'adjusted_r_squared': safe_float(model.rsquared_adj, 0),
                'f_statistic': safe_float(model.fvalue, 0),
                'f_pvalue': safe_float(model.f_pvalue, 0),
                'n_samples': int(model.nobs),
                'n_predictors': len(independent_vars)
            },
            'coefficients': coefficients,
            'residuals': {
                'residual_std_error': safe_float(np.sqrt(model.mse_resid), 0),
                'degrees_of_freedom': int(model.df_resid),
                'min': safe_float(model.resid.min(), 0),
                'max': safe_float(model.resid.max(), 0),
                'mean': safe_float(model.resid.mean(), 0)
            },
            'assumptions': {
                'multicollinearity': {
                    'method': 'VIF',
                    'passed': multicollinearity_passed,
                    'details': vif_dict
                },
                'normality': {
                    'method': 'Shapiro-Wilk (residuals)',
                    'p_value': safe_float(shapiro_pval, 0),
                    'passed': normality_passed
                },
                'homoscedasticity': {
                    'method': 'Breusch-Pagan',
                    'p_value': safe_float(bp_pval, 0),
                    'passed': homoscedasticity_passed
                }
            },
            'interpretation': f'Model explains {safe_float(model.rsquared * 100, 0):.1f}% of variance. ' + \
                            f'{"All predictors significant at p<0.05." if all(p < 0.05 for p in model.pvalues[1:]) else "Some predictors not significant."}'
        }

    except Exception as e:
        raise Exception(f"Error in linear regression: {str(e)}")


def run_logistic_regression(data, dependent_var, independent_vars):
    """Fit logistic regression model"""
    try:
        df = pd.DataFrame(data)

        # Get dependent variable and ensure it's binary
        y_raw = df[dependent_var].dropna()
        unique_vals = y_raw.unique()

        if len(unique_vals) != 2:
            raise ValueError(f"Logistic regression requires binary outcome, found {len(unique_vals)} classes")

        # Encode binary outcome to 0/1
        le = LabelEncoder()
        y = pd.Series(le.fit_transform(y_raw), index=y_raw.index)

        # Prepare independent variables
        X_dict = {}
        for var in independent_vars:
            series = df[var]
            # Try to convert to numeric first
            numeric_series = pd.to_numeric(series, errors='coerce')

            # Count how many values successfully converted to numeric
            numeric_count = numeric_series.notna().sum()
            original_count = series.notna().sum()

            if numeric_count == original_count and original_count > 0:
                # It's numeric - use the numeric version
                X_dict[var] = numeric_series.astype('float64')
            else:
                # It's categorical - one-hot encode it
                dummies = pd.get_dummies(series, prefix=var, drop_first=True, dtype='float64')
                for col in dummies.columns:
                    X_dict[col] = dummies[col].astype('float64')

        X = pd.DataFrame(X_dict)

        # Ensure all columns are numeric
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce')

        # Remove rows with missing values
        valid_idx = y.notna() & X.notna().all(axis=1)
        y = y[valid_idx].reset_index(drop=True).astype('int64')
        X = X[valid_idx].reset_index(drop=True)

        if len(y) == 0:
            raise ValueError("No valid data after removing missing values")

        # Add constant
        X = sm.add_constant(X)

        # Fit logistic regression
        logit_model = sm.Logit(y, X).fit(disp=0)

        # Extract coefficients with odds ratios
        coefficients = []
        conf_int_df = logit_model.conf_int()
        for i, var_name in enumerate(X.columns):
            coef = logit_model.params.iloc[i]
            std_err = logit_model.bse.iloc[i]
            z_stat = logit_model.tvalues.iloc[i]
            p_val = logit_model.pvalues.iloc[i]
            ci_row = conf_int_df.iloc[i]
            odds_ratio = np.exp(coef)

            coefficients.append({
                'variable': var_name,
                'coefficient': safe_float(coef, 0),
                'std_error': safe_float(std_err, 0),
                'z_statistic': safe_float(z_stat, 0),
                'p_value': safe_float(p_val, 0),
                'ci_lower': safe_float(ci_row.iloc[0], 0),
                'ci_upper': safe_float(ci_row.iloc[1], 0),
                'odds_ratio': safe_float(odds_ratio, 1.0)
            })

        # Calculate VIF for multicollinearity
        vif_dict = {}
        X_no_const = X.drop('const', axis=1)
        if len(X_no_const.columns) > 0:
            for i, col in enumerate(X_no_const.columns):
                try:
                    vif = variance_inflation_factor(X_no_const.values, i)
                    vif_dict[col] = safe_float(vif, 1.0)
                except:
                    vif_dict[col] = 1.0

        # Multicollinearity check
        multicollinearity_passed = bool(all(v < 5 for v in vif_dict.values())) if vif_dict else True

        # Calculate classification metrics
        y_pred_prob = logit_model.predict(X)
        y_pred = (y_pred_prob > 0.5).astype(int)

        accuracy = accuracy_score(y, y_pred)
        try:
            auc = roc_auc_score(y, y_pred_prob)
        except:
            auc = 0.5

        tn, fp, fn, tp = confusion_matrix(y, y_pred).ravel()
        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0

        # McFadden's pseudo R-squared
        llf_full = logit_model.llf
        llf_null = -len(y) * np.log(1 / (1 - y.mean()))  # null model with intercept only
        mcfadden_r2 = 1 - (llf_full / llf_null) if llf_null != 0 else 0

        # Chi-square for overall model significance
        n_params = len(X.columns) - 1  # exclude intercept
        chi_square_stat = -2 * (llf_null - llf_full)
        chi_square_pval = 1 - stats.chi2.cdf(chi_square_stat, n_params)

        return {
            'regression_type': 'logistic',
            'dependent_variable': dependent_var,
            'independent_variables': independent_vars,
            'model_fit': {
                'mcfadden_r_squared': safe_float(mcfadden_r2, 0),
                'aic': safe_float(logit_model.aic, 0),
                'bic': safe_float(logit_model.bic, 0),
                'chi_square': safe_float(chi_square_stat, 0),
                'chi_square_pvalue': safe_float(chi_square_pval, 0),
                'n_samples': len(y)
            },
            'coefficients': coefficients,
            'classification_metrics': {
                'accuracy': safe_float(accuracy, 0),
                'sensitivity': safe_float(sensitivity, 0),
                'specificity': safe_float(specificity, 0),
                'auc': safe_float(auc, 0)
            },
            'assumptions': {
                'multicollinearity': {
                    'method': 'VIF',
                    'passed': multicollinearity_passed,
                    'details': vif_dict
                }
            },
            'interpretation': f'Model shows {"good" if auc > 0.7 else "moderate" if auc > 0.6 else "poor"} predictive power (AUC={safe_float(auc, 0):.3f}). ' + \
                            f'Accuracy: {safe_float(accuracy * 100, 0):.1f}%.'
        }

    except Exception as e:
        raise Exception(f"Error in logistic regression: {str(e)}")
