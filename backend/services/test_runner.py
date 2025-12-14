import numpy as np
import pandas as pd
from scipy import stats


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


def prepare_numeric_data(data, column):
    """Extract and clean numeric data"""
    values = pd.to_numeric(data[column], errors='coerce').dropna()
    return values.values


def prepare_categorical_data(data, column):
    """Extract categorical data"""
    return data[column].dropna().values


def run_ttest(data, numeric_var, categorical_var):
    """Independent samples t-test"""
    try:
        df = pd.DataFrame(data)
        numeric_data = prepare_numeric_data(df, numeric_var)
        categorical_data = prepare_categorical_data(df, categorical_var)

        # Get unique groups (should be 2)
        groups = df[categorical_var].dropna().unique()
        if len(groups) != 2:
            raise ValueError(f"t-test requires exactly 2 groups, found {len(groups)}")

        # Split data by group
        group1_data = df[df[categorical_var] == groups[0]][numeric_var].dropna()
        group2_data = df[df[categorical_var] == groups[1]][numeric_var].dropna()

        group1_vals = pd.to_numeric(group1_data, errors='coerce').dropna().values
        group2_vals = pd.to_numeric(group2_data, errors='coerce').dropna().values

        # Perform t-test
        t_stat, p_value = stats.ttest_ind(group1_vals, group2_vals)

        # Calculate statistics for each group
        def calc_stats(values):
            n = len(values)
            mean = np.mean(values)
            std = np.std(values, ddof=1)
            se = std / np.sqrt(n)
            ci = 1.96 * se
            return {
                'n': int(n),
                'mean': float(mean),
                'std': float(std),
                'ci_mean_lower': float(mean - ci),
                'ci_mean_upper': float(mean + ci)
            }

        group1_stats = calc_stats(group1_vals)
        group2_stats = calc_stats(group2_vals)

        # Mean difference and CI
        mean_diff = np.mean(group1_vals) - np.mean(group2_vals)
        pooled_std = np.sqrt((group1_stats['std']**2 + group2_stats['std']**2) / 2)
        se_diff = pooled_std * np.sqrt(1/group1_stats['n'] + 1/group2_stats['n'])
        ci_diff = 1.96 * se_diff

        # Assumptions tests
        _, p_norm1 = stats.shapiro(group1_vals) if len(group1_vals) > 2 else (None, 0.5)
        _, p_norm2 = stats.shapiro(group2_vals) if len(group2_vals) > 2 else (None, 0.5)
        _, p_levene = stats.levene(group1_vals, group2_vals)

        df_total = len(group1_vals) + len(group2_vals) - 2

        # Apply safe_float to group stats
        def safe_group_stats(stats_dict):
            return {
                'n': stats_dict['n'],
                'mean': safe_float(stats_dict['mean']),
                'std': safe_float(stats_dict['std']),
                'ci_mean_lower': safe_float(stats_dict['ci_mean_lower']),
                'ci_mean_upper': safe_float(stats_dict['ci_mean_upper'])
            }

        return {
            'test_name': 't-Test (Independent)',
            'test_type': 'ttest',
            'statistics': {
                't_statistic': safe_float(t_stat),
                'p_value': safe_float(p_value),
                'df': int(df_total),
                'mean_diff': safe_float(mean_diff),
                'ci_lower': safe_float(mean_diff - ci_diff),
                'ci_upper': safe_float(mean_diff + ci_diff)
            },
            'groups': {
                str(groups[0]): safe_group_stats(group1_stats),
                str(groups[1]): safe_group_stats(group2_stats)
            },
            'assumptions': {
                'normality': {
                    'method': 'Shapiro-Wilk',
                    'p_value': safe_float(min(p_norm1, p_norm2)),
                    'passed': safe_float(min(p_norm1, p_norm2)) > 0.05
                },
                'homogeneity': {
                    'method': 'Levene',
                    'p_value': safe_float(p_levene),
                    'passed': safe_float(p_levene) > 0.05
                }
            },
            'interpretation': 'Significant difference detected (p < 0.05)' if safe_float(p_value) < 0.05 else 'No significant difference (p ≥ 0.05)'
        }
    except Exception as e:
        raise Exception(f"Error in t-test: {str(e)}")


def run_paired_ttest(data, var1, var2):
    """Paired samples t-test"""
    try:
        df = pd.DataFrame(data)

        # Get paired data (remove rows with missing values)
        data_paired = df[[var1, var2]].dropna()
        var1_vals = pd.to_numeric(data_paired[var1], errors='coerce').values
        var2_vals = pd.to_numeric(data_paired[var2], errors='coerce').values

        # Remove any remaining NaN pairs
        valid_idx = ~(np.isnan(var1_vals) | np.isnan(var2_vals))
        var1_vals = var1_vals[valid_idx]
        var2_vals = var2_vals[valid_idx]

        # Calculate differences
        differences = var1_vals - var2_vals

        # Perform paired t-test
        t_stat, p_value = stats.ttest_rel(var1_vals, var2_vals)

        # Calculate statistics
        def calc_stats(values, name):
            n = len(values)
            mean = np.mean(values)
            std = np.std(values, ddof=1)
            se = std / np.sqrt(n)
            ci = 1.96 * se
            return {
                'n': int(n),
                'mean': float(mean),
                'std': float(std),
                'ci_mean_lower': float(mean - ci),
                'ci_mean_upper': float(mean + ci)
            }

        var1_stats = calc_stats(var1_vals, var1)
        var2_stats = calc_stats(var2_vals, var2)

        mean_diff = np.mean(differences)
        std_diff = np.std(differences, ddof=1)
        se_diff = std_diff / np.sqrt(len(differences))
        ci_diff = 1.96 * se_diff

        # Assumptions test
        _, p_norm = stats.shapiro(differences) if len(differences) > 2 else (None, 0.5)

        # Apply safe_float to pair stats
        def safe_pair_stats(stats_dict):
            return {
                'n': stats_dict['n'],
                'mean': safe_float(stats_dict['mean']),
                'std': safe_float(stats_dict['std']),
                'ci_mean_lower': safe_float(stats_dict['ci_mean_lower']),
                'ci_mean_upper': safe_float(stats_dict['ci_mean_upper'])
            }

        return {
            'test_name': 'Paired t-Test',
            'test_type': 'paired_ttest',
            'statistics': {
                't_statistic': safe_float(t_stat),
                'p_value': safe_float(p_value),
                'df': int(len(differences) - 1),
                'mean_diff': safe_float(mean_diff),
                'ci_lower': safe_float(mean_diff - ci_diff),
                'ci_upper': safe_float(mean_diff + ci_diff)
            },
            'pairs': {
                var1: safe_pair_stats(var1_stats),
                var2: safe_pair_stats(var2_stats)
            },
            'assumptions': {
                'normality_of_differences': {
                    'method': 'Shapiro-Wilk',
                    'p_value': safe_float(p_norm),
                    'passed': safe_float(p_norm) > 0.05
                }
            },
            'interpretation': 'Significant difference detected (p < 0.05)' if safe_float(p_value) < 0.05 else 'No significant difference (p ≥ 0.05)'
        }
    except Exception as e:
        raise Exception(f"Error in paired t-test: {str(e)}")


def run_anova(data, numeric_var, categorical_var):
    """One-way ANOVA"""
    try:
        df = pd.DataFrame(data)

        # Get groups
        groups = df[categorical_var].dropna().unique()
        if len(groups) < 2:
            raise ValueError(f"ANOVA requires at least 2 groups, found {len(groups)}")

        # Prepare data for each group
        group_data = []
        for group in groups:
            group_vals = pd.to_numeric(df[df[categorical_var] == group][numeric_var], errors='coerce').dropna().values
            if len(group_vals) > 0:
                group_data.append(group_vals)

        # Perform ANOVA
        f_stat, p_value = stats.f_oneway(*group_data)

        # Calculate statistics
        all_vals = np.concatenate(group_data)
        grand_mean = np.mean(all_vals)
        n_total = len(all_vals)

        # Sum of squares
        ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in group_data)
        ss_within = sum(np.sum((g - np.mean(g))**2) for g in group_data)

        df_between = len(groups) - 1
        df_within = n_total - len(groups)

        ms_between = ss_between / df_between
        ms_within = ss_within / df_within

        # Group statistics
        def calc_stats(values):
            n = len(values)
            mean = np.mean(values)
            std = np.std(values, ddof=1)
            se = std / np.sqrt(n)
            ci = 1.96 * se
            return {
                'n': int(n),
                'mean': safe_float(mean),
                'std': safe_float(std),
                'ci_mean_lower': safe_float(mean - ci),
                'ci_mean_upper': safe_float(mean + ci)
            }

        groups_stats = {str(group): calc_stats(group_data[i]) for i, group in enumerate(groups)}

        # Assumptions tests
        _, p_levene = stats.levene(*group_data)

        return {
            'test_name': 'ANOVA (One-way)',
            'test_type': 'anova',
            'statistics': {
                'f_statistic': safe_float(f_stat),
                'p_value': safe_float(p_value),
                'df_between': int(df_between),
                'df_within': int(df_within),
                'ss_between': safe_float(ss_between),
                'ss_within': safe_float(ss_within),
                'ms_between': safe_float(ms_between),
                'ms_within': safe_float(ms_within)
            },
            'groups': groups_stats,
            'assumptions': {
                'homogeneity': {
                    'method': 'Levene',
                    'p_value': safe_float(p_levene),
                    'passed': safe_float(p_levene) > 0.05
                }
            },
            'interpretation': 'Significant difference between groups detected (p < 0.05)' if safe_float(p_value) < 0.05 else 'No significant difference between groups (p ≥ 0.05)'
        }
    except Exception as e:
        raise Exception(f"Error in ANOVA: {str(e)}")


def run_mann_whitney(data, numeric_var, categorical_var):
    """Mann-Whitney U test (Wilcoxon Rank Sum)"""
    try:
        df = pd.DataFrame(data)

        groups = df[categorical_var].dropna().unique()
        if len(groups) != 2:
            raise ValueError(f"Mann-Whitney U test requires exactly 2 groups, found {len(groups)}")

        group1_vals = pd.to_numeric(df[df[categorical_var] == groups[0]][numeric_var], errors='coerce').dropna().values
        group2_vals = pd.to_numeric(df[df[categorical_var] == groups[1]][numeric_var], errors='coerce').dropna().values

        # Perform Mann-Whitney U test
        u_stat, p_value = stats.mannwhitneyu(group1_vals, group2_vals, alternative='two-sided')

        # Calculate effect size (r = Z / sqrt(N)) - handle NaN/Inf
        n1, n2 = len(group1_vals), len(group2_vals)
        if p_value < 1 and p_value > 0:
            z_score = stats.norm.ppf(1 - p_value / 2)
            effect_size_r = safe_float(z_score / np.sqrt(n1 + n2))
        else:
            effect_size_r = 0.0

        # Group statistics
        def calc_stats(values):
            return {
                'n': int(len(values)),
                'median': safe_float(np.median(values))
            }

        return {
            'test_name': 'Wilcoxon Rank Sum (Mann-Whitney U)',
            'test_type': 'mann_whitney',
            'statistics': {
                'u_statistic': safe_float(u_stat),
                'p_value': safe_float(p_value),
                'effect_size_r': effect_size_r
            },
            'groups': {
                str(groups[0]): calc_stats(group1_vals),
                str(groups[1]): calc_stats(group2_vals)
            },
            'interpretation': 'Significant difference detected (p < 0.05)' if p_value < 0.05 else 'No significant difference (p ≥ 0.05)'
        }
    except Exception as e:
        raise Exception(f"Error in Mann-Whitney U test: {str(e)}")


def run_wilcoxon_signed_rank(data, var1, var2):
    """Wilcoxon Signed-Rank test"""
    try:
        df = pd.DataFrame(data)

        data_paired = df[[var1, var2]].dropna()
        var1_vals = pd.to_numeric(data_paired[var1], errors='coerce').values
        var2_vals = pd.to_numeric(data_paired[var2], errors='coerce').values

        valid_idx = ~(np.isnan(var1_vals) | np.isnan(var2_vals))
        var1_vals = var1_vals[valid_idx]
        var2_vals = var2_vals[valid_idx]

        # Perform Wilcoxon Signed-Rank test
        w_stat, p_value = stats.wilcoxon(var1_vals, var2_vals)

        # Calculate effect size - handle NaN/Inf
        n = len(var1_vals)
        if p_value < 1 and p_value > 0:
            z_score = stats.norm.ppf(1 - p_value / 2)
            effect_size_r = safe_float(z_score / np.sqrt(n))
        else:
            effect_size_r = 0.0

        return {
            'test_name': 'Wilcoxon Signed-Rank Test',
            'test_type': 'wilcoxon_signed_rank',
            'statistics': {
                'w_statistic': safe_float(w_stat),
                'p_value': safe_float(p_value),
                'effect_size_r': effect_size_r
            },
            'pairs': {
                var1: {'n': int(n), 'median': safe_float(np.median(var1_vals))},
                var2: {'n': int(n), 'median': safe_float(np.median(var2_vals))}
            },
            'interpretation': 'Significant difference detected (p < 0.05)' if p_value < 0.05 else 'No significant difference (p ≥ 0.05)'
        }
    except Exception as e:
        raise Exception(f"Error in Wilcoxon Signed-Rank test: {str(e)}")


def run_kruskal_wallis(data, numeric_var, categorical_var):
    """Kruskal-Wallis test"""
    try:
        df = pd.DataFrame(data)

        groups = df[categorical_var].dropna().unique()
        if len(groups) < 2:
            raise ValueError(f"Kruskal-Wallis test requires at least 2 groups, found {len(groups)}")

        group_data = []
        for group in groups:
            group_vals = pd.to_numeric(df[df[categorical_var] == group][numeric_var], errors='coerce').dropna().values
            if len(group_vals) > 0:
                group_data.append(group_vals)

        # Perform Kruskal-Wallis test
        h_stat, p_value = stats.kruskal(*group_data)

        # Calculate mean ranks
        all_vals = np.concatenate(group_data)
        ranks = stats.rankdata(all_vals)

        groups_stats = {}
        rank_idx = 0
        for i, group in enumerate(groups):
            group_size = len(group_data[i])
            group_ranks = ranks[rank_idx:rank_idx + group_size]
            mean_rank = np.mean(group_ranks)
            groups_stats[str(group)] = {
                'n': int(group_size),
                'median': safe_float(np.median(group_data[i])),
                'mean_rank': safe_float(mean_rank)
            }
            rank_idx += group_size

        return {
            'test_name': 'Kruskal-Wallis Test',
            'test_type': 'kruskal_wallis',
            'statistics': {
                'h_statistic': safe_float(h_stat),
                'p_value': safe_float(p_value),
                'df': int(len(groups) - 1)
            },
            'groups': groups_stats,
            'interpretation': 'Significant difference between groups detected (p < 0.05)' if safe_float(p_value) < 0.05 else 'No significant difference between groups (p ≥ 0.05)'
        }
    except Exception as e:
        raise Exception(f"Error in Kruskal-Wallis test: {str(e)}")


def run_chi_square(data, var1, var2):
    """Chi-Square test of independence"""
    try:
        df = pd.DataFrame(data)

        # Create contingency table
        contingency = pd.crosstab(df[var1], df[var2])

        # Perform chi-square test
        chi2_stat, p_value, df_chi, expected = stats.chi2_contingency(contingency)

        # Chi-square contributions
        chi2_contrib = (contingency.values - expected)**2 / expected

        # Safe conversion of nested lists
        expected_safe = [[safe_float(val) for val in row] for row in expected.tolist()]
        chi2_contrib_safe = [[safe_float(val) for val in row] for row in chi2_contrib.tolist()]

        return {
            'test_name': 'Chi-Square Test',
            'test_type': 'chi_square',
            'statistics': {
                'chi_square': safe_float(chi2_stat),
                'p_value': safe_float(p_value),
                'df': int(df_chi)
            },
            'contingency_table': {
                'rows': contingency.index.tolist(),
                'columns': contingency.columns.tolist(),
                'observed': contingency.values.tolist(),
                'expected': expected_safe,
                'chi_square_contributions': chi2_contrib_safe
            },
            'interpretation': 'Significant association between variables detected (p < 0.05)' if safe_float(p_value) < 0.05 else 'No significant association between variables (p ≥ 0.05)'
        }
    except Exception as e:
        raise Exception(f"Error in Chi-Square test: {str(e)}")


def run_pearson_correlation(data, var1, var2):
    """Pearson Correlation"""
    try:
        df = pd.DataFrame(data)

        data_clean = df[[var1, var2]].dropna()
        var1_vals = pd.to_numeric(data_clean[var1], errors='coerce').dropna().values
        var2_vals = pd.to_numeric(data_clean[var2], errors='coerce').dropna().values

        valid_idx = ~(np.isnan(var1_vals) | np.isnan(var2_vals))
        var1_vals = var1_vals[valid_idx]
        var2_vals = var2_vals[valid_idx]

        # Calculate Pearson correlation
        correlation, p_value = stats.pearsonr(var1_vals, var2_vals)

        # Calculate 95% CI for correlation
        n = len(var1_vals)
        z = np.arctanh(correlation)
        se = 1 / np.sqrt(n - 3)
        ci_lower = np.tanh(z - 1.96 * se)
        ci_upper = np.tanh(z + 1.96 * se)

        correlation_safe = safe_float(correlation)
        p_value_safe = safe_float(p_value)
        ci_lower_safe = safe_float(ci_lower)
        ci_upper_safe = safe_float(ci_upper)

        return {
            'test_name': 'Pearson Correlation',
            'test_type': 'pearson_correlation',
            'statistics': {
                'correlation': correlation_safe,
                'p_value': p_value_safe,
                'ci_lower': ci_lower_safe,
                'ci_upper': ci_upper_safe,
                'n': int(n)
            },
            'interpretation': 'Strong positive correlation detected (p < 0.001)' if p_value_safe < 0.001 and correlation_safe > 0.5 else \
                            'Strong negative correlation detected (p < 0.001)' if p_value_safe < 0.001 and correlation_safe < -0.5 else \
                            'Moderate correlation detected (p < 0.05)' if p_value_safe < 0.05 else \
                            'No significant correlation (p ≥ 0.05)'
        }
    except Exception as e:
        raise Exception(f"Error in Pearson correlation: {str(e)}")


def run_spearman_correlation(data, var1, var2):
    """Spearman Correlation"""
    try:
        df = pd.DataFrame(data)

        data_clean = df[[var1, var2]].dropna()
        var1_vals = pd.to_numeric(data_clean[var1], errors='coerce').dropna().values
        var2_vals = pd.to_numeric(data_clean[var2], errors='coerce').dropna().values

        valid_idx = ~(np.isnan(var1_vals) | np.isnan(var2_vals))
        var1_vals = var1_vals[valid_idx]
        var2_vals = var2_vals[valid_idx]

        # Calculate Spearman correlation
        correlation, p_value = stats.spearmanr(var1_vals, var2_vals)

        # Calculate 95% CI for correlation
        n = len(var1_vals)
        z = np.arctanh(correlation)
        se = 1 / np.sqrt(n - 3)
        ci_lower = np.tanh(z - 1.96 * se)
        ci_upper = np.tanh(z + 1.96 * se)

        correlation_safe = safe_float(correlation)
        p_value_safe = safe_float(p_value)
        ci_lower_safe = safe_float(ci_lower)
        ci_upper_safe = safe_float(ci_upper)

        return {
            'test_name': 'Spearman Correlation',
            'test_type': 'spearman_correlation',
            'statistics': {
                'correlation': correlation_safe,
                'p_value': p_value_safe,
                'ci_lower': ci_lower_safe,
                'ci_upper': ci_upper_safe,
                'n': int(n)
            },
            'interpretation': 'Strong positive correlation detected (p < 0.001)' if p_value_safe < 0.001 and correlation_safe > 0.5 else \
                            'Strong negative correlation detected (p < 0.001)' if p_value_safe < 0.001 and correlation_safe < -0.5 else \
                            'Moderate correlation detected (p < 0.05)' if p_value_safe < 0.05 else \
                            'No significant correlation (p ≥ 0.05)'
        }
    except Exception as e:
        raise Exception(f"Error in Spearman correlation: {str(e)}")


def run_kendall_correlation(data, var1, var2):
    """Kendall Correlation (Tau)"""
    try:
        df = pd.DataFrame(data)

        data_clean = df[[var1, var2]].dropna()
        var1_vals = pd.to_numeric(data_clean[var1], errors='coerce').dropna().values
        var2_vals = pd.to_numeric(data_clean[var2], errors='coerce').dropna().values

        valid_idx = ~(np.isnan(var1_vals) | np.isnan(var2_vals))
        var1_vals = var1_vals[valid_idx]
        var2_vals = var2_vals[valid_idx]

        # Calculate Kendall correlation
        tau, p_value = stats.kendalltau(var1_vals, var2_vals)

        tau_safe = safe_float(tau)
        p_value_safe = safe_float(p_value)

        return {
            'test_name': 'Kendall Correlation (Tau)',
            'test_type': 'kendall_correlation',
            'statistics': {
                'tau': tau_safe,
                'p_value': p_value_safe,
                'n': int(len(var1_vals))
            },
            'interpretation': 'Strong positive correlation detected (p < 0.001)' if p_value_safe < 0.001 and tau_safe > 0.5 else \
                            'Strong negative correlation detected (p < 0.001)' if p_value_safe < 0.001 and tau_safe < -0.5 else \
                            'Moderate correlation detected (p < 0.05)' if p_value_safe < 0.05 else \
                            'No significant correlation (p ≥ 0.05)'
        }
    except Exception as e:
        raise Exception(f"Error in Kendall correlation: {str(e)}")
