import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import os

st.set_page_config(layout="wide")
st.title("🏥 NDMR: محطة المراقبة السريرية الذكية")

data_folder = r'D:\SV200040'
files = [f for f in os.listdir(data_folder) if f.endswith('.MEF')]
file = st.selectbox("اختر ملف المريض للتحليل:", files)

if file:
    with open(os.path.join(data_folder, file), 'r', errors='ignore') as f:
        content = f.read()
    
    parts = content.split('|')
    
    # 1. معايرة البيانات (تحويل الأرقام الخام إلى قيم طبية)
    # ملاحظة: تم القسمة على 100 بناءً على البروتوكول الشائع لأجهزة Medicraft
    try:
        ipap_min = int(parts[14]) / 100.0
        ipap_max = int(parts[16]) / 100.0
        pressure_data = [int(x)/100.0 for x in parts[97:150] if x.isdigit()] # منحنى الضغط
        flow_data = [int(x)/10.0 for x in parts[150:] if x.isdigit()]      # منحنى التدفق
    except:
        st.error("خطأ في قراءة البيانات، الملف قد يكون تالفاً.")

    # 2. لوحة القياسات الحيوية
    col1, col2, col3 = st.columns(3)
    col1.metric("ضغط الشهيق الأدنى (Min)", f"{ipap_min} cmH2O")
    col2.metric("ضغط الشهيق الأعلى (Max)", f"{ipap_max} cmH2O")
    col3.metric("حالة الجهاز", "Auto CPAP Mode")

    # 3. منحنى مقارنة الأداء (الضغط مقابل التدفق)
    fig = go.Figure()
    fig.add_trace(go.Scatter(y=pressure_data, name="منحنى الضغط (cmH2O)", line=dict(color='#e74c3c', width=3)))
    fig.add_trace(go.Scatter(y=flow_data, name="منحنى التدفق (L/min)", line=dict(color='#2980b9', width=2)))
    
    fig.update_layout(title="ديناميكية الاستجابة التلقائية (Auto-CPAP)", template="plotly_white")
    st.plotly_chart(fig, use_container_width=True)

    # 4. تقرير طبي تلقائي
    st.subheader("📝 التحليل السريري")
    if ipap_max > 15:
        st.warning("تنبيه: الضغط المرتفع قد يشير إلى مقاومة عالية في مجرى الهواء.")
    else:
        st.success("الضغط ضمن النطاق الآمن والمريح للمريض.")