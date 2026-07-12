"""
Neuroplasticity & Cognitive Training Tracker
-----------------------------------------------
Three well-established cognitive tasks used in working-memory /
processing-speed research, plus a session dashboard so you can see
your own scores trend across repeated attempts:

  - N-Back (working memory)
  - Corsi Block-Tapping Span (visuospatial working memory)
  - Simple Reaction Time (processing speed)

Each game runs entirely client-side in the browser (for millisecond-
accurate timing, which a server round-trip architecture can't provide).
After each attempt, copy the generated result line and paste it into
the "Log a result" box to add it to your session's progress dashboard.

⚠️ Score history is SESSION-ONLY (resets on page refresh / redeploy).
Download your history as CSV to keep a permanent record. See the
README for why real persistent tracking needs a database, which is
out of scope for this build.

Run locally with: streamlit run app.py
"""

import os
import re
import pandas as pd
import streamlit as st
import plotly.graph_objects as go
import streamlit.components.v1 as components

st.set_page_config(page_title="Neuroplasticity Tracker", page_icon="🧠", layout="wide")

GAMES_DIR = os.path.join(os.path.dirname(__file__), "games")

LOG_PATTERNS = {
    "N-Back": re.compile(
        r"(?P<timestamp>[\d-]+ [\d:]+) \| N-Back\((?P<n>\d)\) \| Accuracy: (?P<accuracy>\d+)% "
        r"\| Hits: (?P<hits>\d+) \| Misses: (?P<misses>\d+) \| FalseAlarms: (?P<false_alarms>\d+) "
        r"\| AvgRT: (?P<avg_rt>\d+|N/A)ms"
    ),
    "Corsi Span": re.compile(
        r"(?P<timestamp>[\d-]+ [\d:]+) \| Corsi Span \| Final Span: (?P<span>\d+)"
    ),
    "Reaction Time": re.compile(
        r"(?P<timestamp>[\d-]+ [\d:]+) \| Reaction Time \| Mean: (?P<mean>\d+)ms "
        r"\| Median: (?P<median>\d+)ms \| SD: (?P<sd>\d+)ms \| Trials: (?P<trials>\d+)"
    ),
}


def init_session_state():
    if "history" not in st.session_state:
        st.session_state.history = []  # list of dicts


def parse_log_line(line):
    """Try each known pattern; return (task_name, dict) or (None, None) if no match."""
    line = line.strip()
    for task_name, pattern in LOG_PATTERNS.items():
        m = pattern.match(line)
        if m:
            return task_name, m.groupdict()
    return None, None


def render_game(html_filename, height):
    path = os.path.join(GAMES_DIR, html_filename)
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()
    components.html(html, height=height, scrolling=False)


def render_log_box():
    st.markdown("### 📋 Log a result")
    st.caption("Paste the result line copied from a game above, then click Add.")
    col1, col2 = st.columns([4, 1])
    with col1:
        log_input = st.text_input("Result line", key="log_input", label_visibility="collapsed")
    with col2:
        add_clicked = st.button("Add", use_container_width=True)

    if add_clicked and log_input:
        task_name, parsed = parse_log_line(log_input)
        if task_name is None:
            st.error("Couldn't parse that line — make sure you copied it exactly from the game results.")
        else:
            entry = {"task": task_name, "raw": log_input.strip(), **parsed}
            st.session_state.history.append(entry)
            st.success(f"Logged {task_name} result!")
            st.rerun()


def render_dashboard():
    st.markdown("### 📈 Progress Dashboard")

    if not st.session_state.history:
        st.info("No results logged yet this session. Play a game above and log your result to see trends here.")
        return

    df = pd.DataFrame(st.session_state.history)
    df["attempt_num"] = df.groupby("task").cumcount() + 1

    tabs = st.tabs(["N-Back", "Corsi Span", "Reaction Time", "All logged results"])

    with tabs[0]:
        nb = df[df["task"] == "N-Back"].copy()
        if len(nb) == 0:
            st.info("No N-Back results logged yet.")
        else:
            nb["accuracy"] = nb["accuracy"].astype(int)
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=nb["attempt_num"], y=nb["accuracy"], mode="lines+markers", name="Accuracy %"))
            fig.update_layout(xaxis_title="Attempt #", yaxis_title="Accuracy (%)", height=350,
                               margin=dict(l=10, r=10, t=20, b=10))
            st.plotly_chart(fig, use_container_width=True)
            st.dataframe(nb[["timestamp", "n", "accuracy", "hits", "misses", "false_alarms", "avg_rt"]],
                         use_container_width=True, hide_index=True)

    with tabs[1]:
        cs = df[df["task"] == "Corsi Span"].copy()
        if len(cs) == 0:
            st.info("No Corsi Span results logged yet.")
        else:
            cs["span"] = cs["span"].astype(int)
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=cs["attempt_num"], y=cs["span"], mode="lines+markers", name="Span"))
            fig.update_layout(xaxis_title="Attempt #", yaxis_title="Final Span", height=350,
                               margin=dict(l=10, r=10, t=20, b=10))
            st.plotly_chart(fig, use_container_width=True)
            st.dataframe(cs[["timestamp", "span"]], use_container_width=True, hide_index=True)

    with tabs[2]:
        rt = df[df["task"] == "Reaction Time"].copy()
        if len(rt) == 0:
            st.info("No Reaction Time results logged yet.")
        else:
            rt["mean"] = rt["mean"].astype(int)
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=rt["attempt_num"], y=rt["mean"], mode="lines+markers", name="Mean RT (ms)"))
            fig.update_layout(xaxis_title="Attempt #", yaxis_title="Mean RT (ms)", height=350,
                               margin=dict(l=10, r=10, t=20, b=10))
            st.plotly_chart(fig, use_container_width=True)
            st.dataframe(rt[["timestamp", "mean", "median", "sd", "trials"]], use_container_width=True, hide_index=True)

    with tabs[3]:
        st.dataframe(df[["task", "timestamp", "raw"]], use_container_width=True, hide_index=True)
        csv = df.to_csv(index=False).encode("utf-8")
        st.download_button("Download full history as CSV", csv, "cognitive_training_history.csv", "text/csv")


def main():
    st.title("🧠 Neuroplasticity & Cognitive Training Tracker")
    st.caption(
        "Three neuroscience-backed cognitive tasks — play them, log your results, and watch "
        "your own learning curve form across repeated attempts."
    )
    st.warning(
        "⚠️ **Score history is session-only** — it resets if you refresh the page or the app "
        "restarts. Download your results as CSV from the dashboard tab to keep a permanent "
        "record. This is an educational/self-tracking tool, not a validated clinical assessment."
    )

    init_session_state()

    task = st.radio(
        "Choose a task:",
        ["N-Back", "Corsi Span", "Reaction Time", "📈 Progress Dashboard"],
        horizontal=True,
    )

    st.markdown("---")

    if task == "N-Back":
        render_game("nback.html", height=560)
        render_log_box()
    elif task == "Corsi Span":
        render_game("corsi_span.html", height=620)
        render_log_box()
    elif task == "Reaction Time":
        render_game("reaction_time.html", height=560)
        render_log_box()
    else:
        render_dashboard()


if __name__ == "__main__":
    main()
